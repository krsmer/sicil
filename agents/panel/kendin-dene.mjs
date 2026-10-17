// "Kendin dene" bölümünün sunucu tarafı. Sadece OKUMA ve eth_call simülasyonu: işlem gönderilmez, cüzdan/anahtar yok.
//  (1) mührü doğrula: açılış (Revealed) verisinden keccak256(abi.encode(pair, side, priceE8, sizeE8, thesis, confidence, salt))
//      zincir dışında yeniden hesaplanır ve kasadaki Sealed commitHash ile karşılaştırılır.
//  (2) kontratı kandır: kurallara aykırı çağrılar eth_call ile simüle edilir; kontratın döndürdüğü hata Türkçe açıklanır.
import { BaseError, ContractFunctionRevertedError, parseEventLogs } from "viem";
import { KASA_ABI, SICIL_KASASI, publicClient, readKasa } from "../shared/chain.mjs";
import { commitHash } from "../shared/commit.mjs";

const RE_HASH = /^0x[0-9a-fA-F]{64}$/;

/// Mühür no → { id, hesaplanan, zincirdeki, eslesiyor, girdiler, revealTx }
export async function muhuruDogrula(id, revealTx) {
  const [zincirdeki, pair, notionalCent, ts, acik] = await readKasa("muhur", [BigInt(id)]);
  if (!Number(ts)) return { id, hata: `#${id} numaralı mühür yok` };
  if (!acik) return { id, zincirdeki, hata: "Bu mühür henüz açılmadı: yön, fiyat ve tez hash'in içinde gizli" };
  if (!RE_HASH.test(revealTx ?? "")) return { id, zincirdeki, hata: "Açılış işlemi bulunamadı" };
  const rc = await publicClient.getTransactionReceipt({ hash: revealTx });
  const olay = parseEventLogs({ abi: KASA_ABI, logs: rc.logs, eventName: "Revealed" }).find((e) => Number(e.args.id) === Number(id));
  if (!olay) return { id, zincirdeki, hata: "Açılış işleminde bu mührün Revealed olayı yok" };
  const a = olay.args;
  const hesaplanan = commitHash({ pair, side: Number(a.side), priceE8: a.priceE8, sizeE8: a.sizeE8, thesis: a.thesis, confidence: Number(a.confidence), salt: a.salt });
  return {
    id: Number(id), pair, notionalCent: Number(notionalCent), muhurTs: Number(ts), revealTx, zincirdeki, hesaplanan,
    eslesiyor: hesaplanan.toLowerCase() === zincirdeki.toLowerCase(),
    girdiler: { pair, side: Number(a.side), priceE8: String(a.priceE8), sizeE8: String(a.sizeE8), thesis: a.thesis, confidence: Number(a.confidence), salt: a.salt },
  };
}

const HATA_TR = {
  TutarAsildi: "Tutar, kurulumda yazılan işlem başı limiti aşıyor. Kontrat mührü reddetti; ajan bu emri gönderemez.",
  PariteIzinsiz: "Bu parite kurulumda izin verilenler arasında değil (sadece BTC-USDT, ETH-USDT).",
  YetkiYok: "Bu adresin bu fonksiyonu çağırma yetkisi yok.",
  Durduruldu: "Kasa freni çekilmiş: durdurulmuş kasa yeni mühür kabul etmez (bu kontrol limitten önce gelir).",
  BeklemeDolmadi: "İki mühür arasındaki bekleme süresi (300 sn) dolmadı.",
  TutarSifir: "Sıfır tutarlı mühür kabul edilmez.",
};

function hataAdi(e) {
  if (e instanceof BaseError) {
    const r = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (r instanceof ContractFunctionRevertedError) return { ad: r.data?.errorName ?? r.reason ?? "revert", argumanlar: (r.data?.args ?? []).map(String) };
  }
  return { ad: null, mesaj: (e?.shortMessage ?? e?.message ?? String(e)).slice(0, 160) };
}

/// Kurallara aykırı 4 çağrıyı simüle eder (eth_call). Hiçbir işlem gönderilmez.
export async function kontratiKandir() {
  const [trader, fren] = await Promise.all([readKasa("trader"), readKasa("fren")]);
  const yabanci = "0x000000000000000000000000000000000000dEaD";
  const hash = `0x${"5a".repeat(32)}`;
  const denemeler = [
    { ad: "30 USDT'lik mühür (limit 20)", kimden: trader, fn: "seal", args: [hash, "BTC-USDT", 3000n], beklenen: "TutarAsildi" },
    { ad: "DOGE-USDT mührü", kimden: trader, fn: "seal", args: [hash, "DOGE-USDT", 1000n], beklenen: "PariteIzinsiz" },
    { ad: "Yabancı bir adresten freni çekmek", kimden: yabanci, fn: "pause", args: [], beklenen: "YetkiYok" },
    { ad: "Fren hesabıyla freni bırakmak (unpause)", kimden: fren, fn: "unpause", args: [], beklenen: "YetkiYok" },
  ];
  const sonuclar = [];
  for (const d of denemeler) {
    try {
      await publicClient.simulateContract({ address: SICIL_KASASI, abi: KASA_ABI, functionName: d.fn, args: d.args, account: d.kimden });
      sonuclar.push({ ...d, args: undefined, reddedildi: false, aciklama: "Simülasyon geçti (beklenmiyordu)" });
    } catch (e) {
      const h = hataAdi(e);
      sonuclar.push({ ad: d.ad, kimden: d.kimden, fn: d.fn, beklenen: d.beklenen, reddedildi: true, hata: h.ad, argumanlar: h.argumanlar, aciklama: HATA_TR[h.ad] ?? h.mesaj ?? h.ad });
    }
  }
  return { kontrat: SICIL_KASASI, zaman: Date.now(), not: "eth_call simülasyonu: işlem gönderilmedi, gas harcanmadı, cüzdan kullanılmadı", sonuclar };
}
