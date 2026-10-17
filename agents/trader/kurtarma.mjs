// Ajan açılışında çalışır: "bekleyen açılışlar" dosyasındaki, mühürlenmiş ama açılmamış kayıtları tamamlar.
// Her kayıt için:
//   1. Mühür no yoksa (seal gönderildi, onay gelmeden çöktü) son mühürler arasında commitHash ile ara
//      bulunamazsa ve kayıt 10 dk'dan eskiyse: mühür zincire hiç düşmemiş → kaydı sil
//   2. Mühür zaten açıksa → kaydı sil
//   3. 3 saatlik açıklama penceresi dolduysa → açılamaz (denetçi "tutmadı" sayar) → kaydı sil, logla
//   4. OKX'te clOrdId ile emir var mı: canlıysa iptal et; son durumu oku
//   5. reveal (okxOrdId: emir varsa ordId, yoksa "")
//   6. Dolum varsa ve bu mühür için OCO yoksa → OCO çıkışı koy
//   7. Kaydı sil
// Bağımlılıklar dışarıdan verilir (test edilebilirlik): kasa = { muhurSayisi(), muhur(id), pencereSn, reveal(args) }

const ARAMA_DERINLIGI = 20;
const ONAYSIZ_SILME_MS = 10 * 60_000;

export async function bekleyenleriTamamla({ okx, kasa, depo, ocoKoy, log, simdi = Date.now() }) {
  const sonuclar = [];
  for (const k of depo.liste()) {
    const sonuc = { commitHash: k.commitHash, id: k.id ?? null };
    try {
      // 1. mühür no
      let id = k.id ?? null;
      if (id == null) {
        const n = Number(await kasa.muhurSayisi());
        for (let i = n; i > Math.max(0, n - ARAMA_DERINLIGI); i--) {
          if ((await kasa.muhur(i)).commitHash === k.commitHash) { id = i; break; }
        }
        if (id == null) {
          if (simdi - Date.parse(k.olusturuldu) > ONAYSIZ_SILME_MS) {
            depo.sil(k.commitHash);
            sonuclar.push({ ...sonuc, islem: "silindi", neden: "mühür zincirde yok (onaysız)" });
          } else {
            sonuclar.push({ ...sonuc, islem: "beklemede", neden: "mühür henüz görünmüyor" });
          }
          continue;
        }
        sonuc.id = id;
      }
      const m = await kasa.muhur(id);
      if (m.commitHash !== k.commitHash) throw new Error(`mühür #${id} commitHash uyuşmuyor`);
      // 2. zaten açık
      if (m.acik) {
        depo.sil(k.commitHash);
        sonuclar.push({ ...sonuc, islem: "silindi", neden: "zaten açık" });
        continue;
      }
      // 3. pencere
      if (simdi / 1000 > Number(m.ts) + Number(kasa.pencereSn)) {
        depo.sil(k.commitHash);
        sonuclar.push({ ...sonuc, islem: "silindi", neden: "açıklama penceresi doldu (tutmadı sayılır)" });
        continue;
      }
      // 4. emir
      const clOrdId = `sicil${String(id).padStart(6, "0")}`;
      let ord = null;
      try {
        [ord] = await okx.call("spot_get_order", { instId: k.pair, clOrdId });
      } catch {
        ord = null; // emir OKX'e hiç gitmemiş
      }
      if (ord && !["filled", "canceled", "mmp_canceled"].includes(ord.state)) {
        await okx.call("spot_cancel_order", { instId: k.pair, ordId: ord.ordId });
        [ord] = await okx.call("spot_get_order", { instId: k.pair, ordId: ord.ordId });
      }
      // 5. açıklama: kayıttaki değerlerle (hash bunlarla eşleşir)
      const rev = await kasa.reveal([BigInt(id), k.side, BigInt(k.priceE8), BigInt(k.sizeE8), k.thesis, k.confidence, k.salt, ord?.ordId ?? ""]);
      sonuc.revealTx = rev.hash;
      // 6. dolum varsa ve OCO yoksa çıkış koy
      if (ord && Number(ord.accFillSz || 0) > 0) {
        const bekleyenAlgo = await okx.call("spot_get_algo_orders", { instId: k.pair, ordType: "oco" });
        if (!bekleyenAlgo.some((a) => a.algoClOrdId === `${clOrdId}x`)) {
          const tez = JSON.parse(k.thesis);
          const a = await ocoKoy(okx, { pair: k.pair, id, clOrdId, ord, tpPct: Number(tez.hedefPct), slPct: Number(tez.gecersizlikPct) });
          sonuc.algoId = a?.algoId;
        }
      }
      // 7.
      depo.sil(k.commitHash);
      sonuclar.push({ ...sonuc, islem: "acildi", ordId: ord?.ordId ?? "", state: ord?.state ?? "emir-yok" });
    } catch (e) {
      sonuclar.push({ ...sonuc, islem: "hata", hata: e.message });
    }
  }
  for (const s of sonuclar) log?.("kurtarma", s);
  return sonuclar;
}
