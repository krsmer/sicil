// SİCİL Türkçe panel sunucusu: sadece okur, sadece 127.0.0.1'de dinler. Derleme adımı yok.
//   GET /           → panel/index.html
//   GET /api/durum  → zincir (SicilKasasi + ERC-8004) + denetçi durumu + son rapor + ajan/denetçi log özetleri
// Çalıştırma: node panel/sunucu.mjs   → http://127.0.0.1:8787
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync, openSync, readSync, closeSync } from "node:fs";
import { KASA_ABI, SICIL_KASASI, publicClient, readKasa } from "../shared/chain.mjs";
import { kuralCevir } from "./kural-gosterim.mjs";

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
    };
  });

  const kararlar = trader.filter((s) => s.adim === "karar" && sonra(s)).slice(-25).reverse().map((s) => ({
    ts: s.ts, pair: s.pair, karar: s.karar, guven: s.guven, boyutCarpani: s.boyutCarpani, sureDk: s.sureDk, gerekce: s.gerekce,
    gecerli: s.gecerli, model: s.model, araclar: (s.aracCagrilari ?? []).map((a) => a.arac), sureMs: s.sureMs, aday: s.aday ? { tur: s.aday.tur, giris: s.aday.giris, stop: s.aday.stop, hedef: s.aday.hedef } : null,
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
let sonKuralMs = 0;
createServer(async (req, res) => {
  try {
    if (req.url === "/" || req.url === "/index.html") {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" });
      return res.end(readFileSync(HTML));
    }
    if (req.url === "/api/durum") {
      if (Date.now() - onbellek.ms > 3000) onbellek = { ms: Date.now(), veri: await durum() };
      res.writeHead(200, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
      return res.end(JSON.stringify(onbellek.veri));
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
