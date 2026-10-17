// SİCİL Türkçe panel sunucusu: sadece okur, sadece 127.0.0.1'de dinler. Derleme adımı yok.
//   GET /           → panel/index.html
//   GET /api/durum  → zincir (SicilKasasi + ERC-8004) + denetçi durumu + son rapor + ajan/denetçi log özetleri
//   GET /api/sicil/258 → OKX.AI servis örneği: agentId'nin sicil özeti (/api/durum'dan türetilir)
//   GET /api/avalanche → gas fiyatı, son mührün maliyeti, ortalama blok süresi (canlı ölçüm)
// Çalıştırma: node panel/sunucu.mjs   → http://127.0.0.1:8787
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { KASA_ABI, SICIL_KASASI, publicClient, readKasa } from "../shared/chain.mjs";
import { kuralCevir } from "./kural-gosterim.mjs";
import { kontratiKandir, muhuruDogrula } from "./kendin-dene.mjs";

// .env (GEMINI_API_KEY) sadece sunucuda okunur; tarayıcıya hiçbir yanıtta gitmez
const ENV = new URL("../../.env", import.meta.url);
if (existsSync(ENV)) process.loadEnvFile(ENV);

const PORT = Number(process.env.PANEL_PORT ?? 8787);
const LOGS = new URL("../logs/", import.meta.url);
const REPORTS = new URL("../../reports/", import.meta.url);
const HTML = new URL("./index.html", import.meta.url);
const REPUTATION = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const REP_ABI = JSON.parse(readFileSync(new URL("../shared/abi/erc8004-reputation.json", import.meta.url), "utf8"));
const DENETCI = "0x963261691606dCe9C4C9Bd0a5181371BB4eE3D02";
const TRADER_AGENT_ID = 258n;

const jsonOku = (url) => (existsSync(url) ? JSON.parse(readFileSync(url, "utf8")) : null);

/// JSONL dosyasının son ~bayt kadarını okuyup satırları döndürür (büyük log'larda hızlı)
function jsonlKuyruk(url, bayt = 600_000) {
  if (!existsSync(url)) return [];
  const boyut = statSync(url).size;
  const bas = Math.max(0, boyut - bayt);
  const fd = openSync(url, "r");
  const buf = Buffer.alloc(boyut - bas);
  readSync(fd, buf, 0, buf.length, bas);
  closeSync(fd);
  const satirlar = buf.toString("utf8").split("\n");
  if (bas > 0) satirlar.shift(); // yarım ilk satır
  return satirlar.filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
}

async function zincir() {
  const ad = ["sahip", "trader", "denetci", "fren", "sicilBaslangic", "durduruldu", "sicilBozuk", "muhurSayisi", "sonMuhurTs", "sonDenetimTs", "maxTutarCent", "beklemeSn", "maxGunlukZararCent", "aciklamaPenceresiSn", "pariteler"];
  const sonuc = await publicClient.multicall({
    contracts: ad.map((functionName) => ({ address: SICIL_KASASI, abi: KASA_ABI, functionName })),
    allowFailure: true,
  }).catch(async () => Promise.all(ad.map(async (f) => ({ status: "success", result: await readKasa(f) }))));
  const z = {};
  ad.forEach((a, i) => { const r = sonuc[i]; z[a] = r.status === "success" ? (typeof r.result === "bigint" ? Number(r.result) : r.result) : null; });
  let itibar = null;
  try {
    const [count, value, decimals] = await publicClient.readContract({ address: REPUTATION, abi: REP_ABI, functionName: "getSummary", args: [TRADER_AGENT_ID, [DENETCI], "net-getiri", "sicil"] });
    const [bc, bv, bd] = await publicClient.readContract({ address: REPUTATION, abi: REP_ABI, functionName: "getSummary", args: [TRADER_AGENT_ID, [DENETCI], "kalibrasyon-brier", "sicil"] });
    itibar = { netGetiri: { adet: Number(count), deger: Number(value), ondalik: Number(decimals) }, brier: { adet: Number(bc), deger: Number(bv), ondalik: Number(bd) } };
  } catch (e) { itibar = { hata: e.shortMessage ?? e.message }; }
  const blok = await publicClient.getBlock();
  return { ...z, kontrat: SICIL_KASASI, zincirZamani: Number(blok.timestamp), blok: Number(blok.number), itibar };
}

async function durum() {
  const z = await zincir();
  const d = jsonOku(new URL("denetci-durum.json", LOGS)) ?? {};
  const rapor = d.sonAttest?.upToTs ? jsonOku(new URL(`${d.sonAttest.upToTs}.json`, REPORTS)) : null;
  const trader = jsonlKuyruk(new URL("trader.jsonl", LOGS));
  const denetci = jsonlKuyruk(new URL("denetci.jsonl", LOGS));
  const bas = (z.sicilBaslangic ?? 0) * 1000;
  const sonra = (s) => Date.parse(s.ts) >= bas;

  // Mühür defteri: zincirden okunan mühürler (denetçi durumu) + emir zamanı + puan
  const emirByClOrd = {};
  for (const e of Object.values(d.emirler ?? {})) if (e.clOrdId) emirByClOrd[e.clOrdId] = e;
  const traderMuhur = {};
  for (const s of trader) if (s.adim === "emir" || s.adim === "dolum" || s.adim === "oco") (traderMuhur[s.id] ??= {})[s.adim] = s;
  const muhurler = Object.values(d.muhurler ?? {}).filter((m) => m.ts >= (z.sicilBaslangic ?? 0)).sort((a, b) => b.id - a.id).map((m) => {
    const ac = d.aciklamalar?.[m.id];
    let tez = null;
    try { tez = ac ? JSON.parse(ac.thesis) : null; } catch { tez = { ham: ac?.thesis }; }
    const clOrdId = `sicil${String(m.id).padStart(6, "0")}`;
    const emir = emirByClOrd[clOrdId];
    const islem = rapor?.islemler?.find((x) => x.id === m.id);
    return {
      id: m.id, pair: m.pair, notionalUsdt: m.notionalCent / 100, ts: m.ts, sealTx: m.tx, clOrdId,
      acik: !!ac, revealTx: ac?.tx ?? null, okxOrdId: ac?.okxOrdId || traderMuhur[m.id]?.emir?.ordId || null,
      emirZamani: emir?.cTime ?? null, dolum: traderMuhur[m.id]?.dolum ?? null, oco: traderMuhur[m.id]?.oco ?? null,
      tez, guven: ac?.confidence ?? null, puan: d.puanlar?.[m.id] ?? rapor?.tezler?.find((t) => t.id === m.id) ?? null,
      pnlUsdt: islem?.pnlUsdt ?? null,
      // sicil kaydı kartı için rapordan aynen aktarılır (hesap yok): eşleşme, rapor anındaki fiyat, çıkış ortalaması
      eslesti: islem ? true : null, isaretFiyati: islem?.isaretFiyati ?? null, acikMiktar: islem?.acikMiktar ?? null,
      cikisFiyati: islem?.cikislar?.length ? islem.cikislar.reduce((t, c) => t + c.usdt, 0) / islem.cikislar.reduce((t, c) => t + c.qty, 0) : null,
    };
  });

  const kararlar = trader.filter((s) => s.adim === "karar" && sonra(s)).slice(-25).reverse().map((s) => ({
    ts: s.ts, pair: s.pair, karar: s.karar, guven: s.guven, boyutCarpani: s.boyutCarpani, sureDk: s.sureDk, gerekce: s.gerekce,
    gecerli: s.gecerli, model: s.model, araclar: (s.aracCagrilari ?? []).map((a) => a.arac), sureMs: s.sureMs,
    aracDetay: (s.aracCagrilari ?? []).map((a) => ({ arac: a.arac, girdi: a.girdi ?? null, ms: a.ms ?? null })), // ek alan: araç sırası ve girdileri aday: s.aday ? { tur: s.aday.tur, giris: s.aday.giris, stop: s.aday.stop, hedef: s.aday.hedef } : null,
  }));
  const retler = trader.filter((s) => s.adim === "ret" && sonra(s)).slice(-10).reverse();
  const turlar = trader.filter((s) => ["aday-yok", "tur-atlandi"].includes(s.adim) && sonra(s));
  const attestler = denetci.filter((s) => s.adim === "attest").slice(-6).reverse();
  const notlar = denetci.filter((s) => s.adim === "itibar-notu").slice(-8).reverse();
  const sonDenetim = denetci.filter((s) => s.adim === "denetim").at(-1) ?? null;
  const sonTraderLog = trader.at(-1) ?? null;

  return {
    simdi: Date.now(), zincir: z, ozet: rapor?.ozet ?? sonDenetim ?? null, raporDosyasi: d.sonAttest?.upToTs ? `reports/${d.sonAttest.upToTs}.json` : null,
    sonAttest: d.sonAttest ?? null, eslesmeyenler: rapor?.eslesmeyenler ?? [], muhurler, kararlar, retler, attestler, notlar,
    turSayisi: { adayYok: turlar.filter((s) => s.adim === "aday-yok").length, atlandi: turlar.filter((s) => s.adim === "tur-atlandi").length },
    ajan: { sonLog: sonTraderLog ? { ts: sonTraderLog.ts, adim: sonTraderLog.adim } : null },
  };
}

let onbellek = { ms: 0, veri: null };
async function durumOnbellekli() {
  if (Date.now() - onbellek.ms > 3000) onbellek = { ms: Date.now(), veri: await durum() };
  return onbellek.veri;
}

/// OKX.AI servis örneği: agentId → sicil özeti. Sadece /api/durum verisinden türetilir (yeni hesap yok).
function sicilOzeti(d) {
  const z = d.zincir, o = d.ozet ?? {};
  const ni = z.itibar?.netGetiri, br = z.itibar?.brier;
  return {
    agentId: Number(TRADER_AGENT_ID), ad: "SİCİL Trader", zincir: "eip155:43113", kasa: SICIL_KASASI,
    identityRegistry: "0x8004A818BFB912233c491871b3d84c89A494BD9e", reputationRegistry: REPUTATION, denetci: { adres: DENETCI, agentId: 259 },
    sicil: z.sicilBozuk ? "BOZUK" : "TEMIZ", durduruldu: !!z.durduruldu,
    sicilBaslangic: z.sicilBaslangic ? new Date(z.sicilBaslangic * 1000).toISOString() : null,
    muhur: d.muhurler.length, eslesenEmir: o.eslesen ?? 0, muhursuzEmir: o.eslesmeyen ?? 0, aciklanmamisMuhur: o.unrevealedExpired ?? 0,
    netGetiriUsdt: o.netPnlUsdt ?? null, islemHacmiUsdt: o.islemHacmiUsdt ?? null, tezler: o.tez ?? null, brier: o.brier ?? null,
    erc8004: { netGetiri: ni?.adet ? { notSayisi: ni.adet, ortalamaYuzde: ni.deger / 10 ** ni.ondalik } : null, kalibrasyon: br?.adet ? { notSayisi: br.adet, brier: br.deger / 10 ** br.ondalik } : null },
    sonDenetim: d.sonAttest ? { zaman: new Date(d.sonAttest.ms).toISOString(), tx: d.sonAttest.tx, raporHash: d.sonAttest.reportHash, rapor: d.raporDosyasi ? `https://github.com/krsmer/sicil/blob/main/${d.raporDosyasi}` : null } : null,
    uretildi: new Date(d.simdi).toISOString(),
  };
}

/// "Neden Avalanche?" kartı için canlı ölçüm: gas fiyatı, son mührün maliyeti, ortalama blok süresi (60 sn önbellek)
let avaxOnbellek = { ms: 0, veri: null };
async function avalancheOlcum(d) {
  const [gasPrice, blok] = await Promise.all([publicClient.getGasPrice(), publicClient.getBlock()]);
  const eski = await publicClient.getBlock({ blockNumber: blok.number - 100n });
  const son = d.muhurler[0];
  let muhur = null;
  if (son?.sealTx) {
    const rc = await publicClient.getTransactionReceipt({ hash: son.sealTx });
    muhur = { id: son.id, tx: son.sealTx, gasUsed: Number(rc.gasUsed), effectiveGasPriceWei: Number(rc.effectiveGasPrice), maliyetAvax: Number(rc.gasUsed * rc.effectiveGasPrice) / 1e18 };
  }
  return { gasPriceWei: Number(gasPrice), blokSuresiSn: Number(blok.timestamp - eski.timestamp) / 100, blok: Number(blok.number), muhur, olculdu: Date.now() };
}
let sonKuralMs = 0;
let kandirOnbellek = { ms: 0, veri: null };
createServer(async (req, res) => {
  const sorgu = new URL(req.url ?? "/", "http://127.0.0.1").searchParams;
  req.url = (req.url ?? "/").split("?")[0]; // ?onizleme=… sadece tarayıcıda okunur
  try {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(readFileSync(HTML));
    }
    if (req.url === "/api/durum") {
      await durumOnbellekli();
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(onbellek.veri));
    }
    const sicilEsles = /^\/api\/sicil\/(\d+)$/.exec(req.url);
    if (sicilEsles) {
      res.setHeader("content-type", "application/json; charset=utf-8");
      if (BigInt(sicilEsles[1]) !== TRADER_AGENT_ID) { res.writeHead(404); return res.end(JSON.stringify({ hata: "bu sunucu sadece agentId 258'in sicilini tutar" })); }
      res.writeHead(200, { "cache-control": "no-store" });
      return res.end(JSON.stringify(sicilOzeti(await durumOnbellekli()), null, 2));
    }
    if (req.url === "/api/avalanche") {
      if (Date.now() - avaxOnbellek.ms > 60_000) avaxOnbellek = { ms: Date.now(), veri: await avalancheOlcum(await durumOnbellekli()) };
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(avaxOnbellek.veri));
    }
    if (req.url === "/mimari.png") {
      res.writeHead(200, { "content-type": "image/png", "cache-control": "max-age=3600" });
      return res.end(readFileSync(new URL("../../memory-bank/assets/mimari.png", import.meta.url)));
    }
    if (req.url === "/api/muhur-dogrula") {
      const id = Number(sorgu.get("id"));
      if (!Number.isInteger(id) || id < 1) { res.writeHead(400, { "content-type": "application/json" }); return res.end(JSON.stringify({ hata: "geçersiz mühür no" })); }
      const d = jsonOku(new URL("denetci-durum.json", LOGS)) ?? {};
      const sonuc = await muhuruDogrula(id, d.aciklamalar?.[id]?.tx);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(sonuc, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
    }
    if (req.url === "/api/kandir") {
      if (Date.now() - kandirOnbellek.ms > 15_000) kandirOnbellek = { ms: Date.now(), veri: await kontratiKandir() };
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(kandirOnbellek.veri));
    }
    if (req.url === "/api/kural" && req.method === "POST") {
      // Gösterim: Türkçe kural → Gemini → KOD aralık kontrolü. Gerçek deploy yok.
      if (Date.now() - sonKuralMs < 3000) { res.writeHead(429, { "content-type": "application/json" }); return res.end(JSON.stringify({ hata: "Çok sık istek; 3 sn bekleyin." })); }
      sonKuralMs = Date.now();
      let govde = "";
      for await (const parca of req) { govde += parca; if (govde.length > 4000) break; }
      let metin = "";
      try { metin = String(JSON.parse(govde).metin ?? ""); } catch { /* boş */ }
      const sonuc = await kuralCevir(metin);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(sonuc));
    }
    res.writeHead(404).end("yok");
  } catch (e) {
    res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ hata: e.message }));
  }
}).listen(PORT, "127.0.0.1", () => console.log(`SİCİL panel: http://127.0.0.1:${PORT}`));
