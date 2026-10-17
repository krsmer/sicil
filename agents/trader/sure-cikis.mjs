// "Süre doldu" çıkışı: tez süresi dolan pozisyonun OCO'su spot_amend_algo_order ile güncel fiyata yakın çekilir.
// Emrin kimliği değişmez (17 Ekim'de doğrulandı: algoId, algoClOrdId ve cTime aynı kalır, sadece uTime değişir); çıkış
// yine OCO üzerinden gerçekleşir ve denetçi onu aynı mühre bağlar. Elle satış YOK (mühürsüz satış sicili bozar).

const RE_CIKIS = /^sicil(\d{6})x$/;
export const YAKINLIK = 0.0005; // fiyatın ±%0,05'i

/// trader.jsonl satırlarından mühür no → { pair, sureDk }: "aday" satırını izleyen "muhur" satırı o mührün tezidir.
export function tezSureleri(satirlar) {
  const harita = {};
  let sonAday = null;
  for (const s of satirlar) {
    if (s?.adim === "aday") sonAday = s;
    else if (s?.adim === "muhur" && sonAday) {
      harita[s.id] = { pair: sonAday.pair, sureDk: Number(sonAday.tez?.sureDk) || null };
      sonAday = null;
    }
  }
  return harita;
}

/// Bekleyen sicil OCO'larından süresi dolanlar. muhurTs: id → saniye (zincirden).
export function sureDolanlar({ ocolar, sureler, muhurTs, simdiSn, varsayilanDk = 120 }) {
  const sonuc = [];
  for (const a of ocolar) {
    const m = RE_CIKIS.exec(a.algoClOrdId ?? "");
    if (!m) continue;
    const id = Number(m[1]);
    const ts = muhurTs[id];
    if (!ts) continue;
    const sureDk = sureler[id]?.sureDk ?? varsayilanDk;
    const bitis = ts + sureDk * 60;
    if (simdiSn >= bitis) sonuc.push({ id, algoId: a.algoId, algoClOrdId: a.algoClOrdId, instId: a.instId, sureDk, bitis, gecikmeSn: simdiSn - bitis });
  }
  return sonuc;
}

/// Satış OCO'su için fiyata yakın seviyeler: TP güncel fiyatın biraz üstünde, SL biraz altında (tick'e yuvarlı).
export function yakinSeviyeler(last, tickSz, pay = YAKINLIK) {
  const ondalik = (String(tickSz).split(".")[1] ?? "").length;
  const t = Number(tickSz);
  const tp = Math.ceil((last * (1 + pay)) / t) * t;
  const sl = Math.floor((last * (1 - pay)) / t) * t;
  return { tp: tp.toFixed(ondalik), sl: sl.toFixed(ondalik) };
}

/// Ajan turunun başında çalışır.
export async function sureDolanlariKapat({ okx, muhurTsOku, satirlar, log, simdiSn = Math.floor(Date.now() / 1000) }) {
  const ocolar = await okx.call("spot_get_algo_orders", { ordType: "oco" });
  const sicilOcolar = ocolar.filter((a) => RE_CIKIS.test(a.algoClOrdId ?? ""));
  if (!sicilOcolar.length) return [];
  const muhurTs = {};
  for (const a of sicilOcolar) {
    const id = Number(RE_CIKIS.exec(a.algoClOrdId)[1]);
    muhurTs[id] = Number(await muhurTsOku(id));
  }
  const dolanlar = sureDolanlar({ ocolar: sicilOcolar, sureler: tezSureleri(satirlar), muhurTs, simdiSn });
  for (const x of dolanlar) {
    try {
      const [inst] = await okx.call("market_get_instruments", { instType: "SPOT", instId: x.instId, demo: true });
      const [t] = await okx.call("market_get_ticker", { instId: x.instId, demo: true });
      const { tp, sl } = yakinSeviyeler(Number(t.last), inst.tickSz);
      const [r] = await okx.call("spot_amend_algo_order", { instId: x.instId, algoId: x.algoId, newTpTriggerPx: tp, newTpOrdPx: "-1", newSlTriggerPx: sl, newSlOrdPx: "-1" });
      log("sure-doldu-cikis", { ...x, last: Number(t.last), tp, sl, sCode: r?.sCode, sMsg: r?.sMsg });
    } catch (e) {
      log("sure-doldu-hata", { ...x, hata: e.message });
    }
  }
  return dolanlar;
}
