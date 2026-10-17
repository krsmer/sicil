// Kural motoru: BTC-USDT / ETH-USDT için rejim + ATR'den ADAY üretir. Sayıları (giriş, stop, hedef, tavan tutar) sadece
// burası belirler; LLM bunları değiştiremez, yalnızca boyutu küçültebilir ve AL / BEKLE / PAS der.
// Spotta pozisyon SADECE ALIŞ ile açılır: aşağı trendde aday yoktur (açığa satış tasarlanmaz).
// Veri: TR demo piyasası (demo: true) 1 saatlik mumlar; fiyatlar emrin gideceği piyasadan.

export const AYAR = {
  bar: "1H",
  mumSayisi: 100,
  emaKisa: 20,
  emaUzun: 50,
  atrDonem: 14,
  egimBar: 3, // EMA20 eğimi: son 3 mum
  egimEsik: 0.0005, // |eğim| bundan küçükse yatay
  donusAtr: 0.5, // yatayda: kapanış EMA20 − 0.5×ATR altındaysa ortalamaya dönüş adayı
  stopAtr: 1.5,
  hedefAtr: 2.0,
  riskButceUsdt: 0.3, // işlem başı kabul edilen zarar (stopa gelirse)
};

function ema(degerler, donem) {
  const k = 2 / (donem + 1);
  let e = degerler.slice(0, donem).reduce((a, b) => a + b, 0) / donem;
  const seri = [e];
  for (let i = donem; i < degerler.length; i++) seri.push((e = degerler[i] * k + e * (1 - k)));
  return seri;
}

function atr(mumlar, donem) {
  const tr = mumlar.slice(1).map((m, i) => {
    const onceki = mumlar[i].c;
    return Math.max(m.h - m.l, Math.abs(m.h - onceki), Math.abs(m.l - onceki));
  });
  let a = tr.slice(0, donem).reduce((x, y) => x + y, 0) / donem; // Wilder
  for (let i = donem; i < tr.length; i++) a = (a * (donem - 1) + tr[i]) / donem;
  return a;
}

/// Tek parite için piyasa durumu ve (varsa) aday.
export async function adayUret(okx, pair, { maxTutarUsdt, ayar = AYAR } = {}) {
  // ATK mumları yeniden eskiye döner: [ts, o, h, l, c, vol, ...]; kapanmamış son mumu (confirm = "0") at
  const ham = await okx.call("market_get_candles", { instId: pair, bar: ayar.bar, limit: ayar.mumSayisi, demo: true });
  const mumlar = ham
    .filter((r) => r[8] === undefined || r[8] === "1")
    .map((r) => ({ ts: Number(r[0]), o: +r[1], h: +r[2], l: +r[3], c: +r[4] }))
    .reverse();
  if (mumlar.length < ayar.emaUzun + ayar.egimBar) throw new Error(`${pair}: yetersiz mum (${mumlar.length})`);

  const kapanis = mumlar.map((m) => m.c);
  const e20 = ema(kapanis, ayar.emaKisa);
  const e50 = ema(kapanis, ayar.emaUzun);
  const ema20 = e20.at(-1);
  const ema50 = e50.at(-1);
  const egim = (ema20 - e20.at(-1 - ayar.egimBar)) / ema20;
  const atr14 = atr(mumlar, ayar.atrDonem);
  const son = mumlar.at(-1);

  let rejim = "yatay";
  if (ema20 > ema50 && egim > ayar.egimEsik) rejim = "yukari-trend";
  else if (ema20 < ema50 && egim < -ayar.egimEsik) rejim = "asagi-trend";

  const [tk] = await okx.call("market_get_ticker", { instId: pair, demo: true });
  const giris = Number(tk.bidPx); // post_only alış en iyi alışa katılır
  const durum = {
    pair, rejim, kapanis: son.c, mumTs: new Date(son.ts).toISOString(),
    ema20: +ema20.toFixed(2), ema50: +ema50.toFixed(2), egim: +egim.toFixed(5),
    atr: +atr14.toFixed(2), atrPct: +((atr14 / son.c) * 100).toFixed(3), giris,
  };

  let tur = null;
  if (rejim === "yukari-trend") tur = "trend-takip";
  else if (rejim === "yatay" && son.c < ema20 - ayar.donusAtr * atr14) tur = "ortalamaya-donus";
  if (!tur) return { durum, aday: null, neden: rejim === "asagi-trend" ? "aşağı trend: spotta açığa satış yok" : "yatay, dönüş seviyesi yok" };

  const stop = giris - ayar.stopAtr * atr14;
  const hedef = giris + ayar.hedefAtr * atr14;
  const stopPct = (giris - stop) / giris;
  const hamTutarUsdt = ayar.riskButceUsdt / stopPct; // volatiliteye göre boyut
  return {
    durum,
    aday: {
      pair, yon: "al", tur, giris,
      stop: +stop.toFixed(1), hedef: +hedef.toFixed(1),
      gecersizlikPct: +(stopPct * 100).toFixed(3),
      hedefPct: +(((hedef - giris) / giris) * 100).toFixed(3),
      hamTutarUsdt: +hamTutarUsdt.toFixed(2), // kontrat limitini aşabilir → ret anı
      tavanUsdt: +Math.min(hamTutarUsdt, maxTutarUsdt ?? Infinity).toFixed(2),
    },
  };
}
