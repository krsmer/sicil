// SİCİL denetçi ajanı. LLM KULLANMAZ; sadece-okuma OKX anahtarı (`denetci` profili, --read-only) ve denetçi cüzdanı.
// Her turda:
//   1. Zincir: SicilKasasi Sealed / Revealed olayları (artımlı, 100 blokluk parçalar)
//   2. OKX: sicilBaslangic'ten sonraki BÜTÜN dolumlar → ordId'ye göre grupla → emir kayıtları + OCO geçmişi
//   3. Eşleştirme (techContext.md "Denetçinin dolum eşleştirme prosedürü"):
//        giriş: emir.clOrdId = sicilNNNNNN, mühür var, mühür ts ≥ sicilBaslangic ve < emir cTime, alış,
//               gerçek dolum tutarı ≤ mühür tutarı + 1 cent
//        çıkış: emir.algoClOrdId = sicilNNNNNNx VE emir.algoId OCO geçmişinde aynı algoClOrdId ile var VE bu ordId o algonun
//               ordIdList'inde VE algo cTime ≥ sicilBaslangic ve > mühür ts VE mührün girişi eşleşmiş VE satış miktarı ≤ giriş
//        (Etiket tek başına kanıt değildir: sabahki test OCO'su da "sicil000002x" etiketliydi.)
//      Eşleşmeyen her emir = unmatched → attest → kalıcı SicilBozuldu.
//   4. Net getiri SADECE mühürlü işlemlerin dolumlarından (hesap bakiyesinden değil)
//   5. Tez puanlama (1m demo mumları, önce hedef mi stop mu; ikisi aynı mumda → tutmadı) + açıklanmamış mühürler + Brier
//   6. reports/<upToTs>.json → keccak256 → attest(upToTs, matched, unmatched, unrevealedExpired, dayPnlCent, reportHash)
//
// Çalıştırma: node denetci/denetci.mjs [--tek-tur] [--aralik 60] [--kuru]   (--kuru: rapor üretir, zincire yazmaz)
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { pathToFileURL } from "node:url";
import { parseArgs } from "node:util";
import { keccak256 } from "viem";
import { publicClient as _pc } from "../shared/chain.mjs";
import { KASA_DEPLOY_BLOGU, SICIL_KASASI, kasaOlaylari, publicClient, readKasa, snowtrace, walletFor, writeKasa } from "../shared/chain.mjs";
import { log, logDosyasi } from "../shared/log.mjs";
import { connectOkx } from "../shared/okx.mjs";

logDosyasi("denetci.jsonl");
const { values: opt } = parseArgs({
  strict: false,
  options: {
    "tek-tur": { type: "boolean", default: false },
    kuru: { type: "boolean", default: false },
    aralik: { type: "string", default: process.env.DENETCI_ARALIK_SN ?? "60" },
  },
});

const DURUM_DOSYASI = new URL("../logs/denetci-durum.json", import.meta.url);
const RAPOR_DIR = opt.kuru ? new URL("../logs/kuru-raporlar/", import.meta.url) : new URL("../../reports/", import.meta.url);
const KALP_ATISI_MS = 10 * 60_000; // değişiklik yoksa bile en geç 10 dk'da bir attest

// ERC-8004 Reputation (K-07, K-12): denetçi → trader agentId 258, saatte bir iki not
const REPUTATION = "0x8004B663056A597Dffe9eCcC1965A193B7388713";
const REPUTATION_ABI = JSON.parse(readFileSync(new URL("../shared/abi/erc8004-reputation.json", import.meta.url), "utf8"));
const TRADER_AGENT_ID = 258n;
const NOT_ARALIGI_MS = 60 * 60_000;
const REPO_KOK = fileURLToPath(new URL("../../", import.meta.url));
const RAPOR_URL = (ts) => `https://raw.githubusercontent.com/krsmer/sicil/main/reports/${ts}.json`;
const RE_GIRIS = /^sicil(\d{6})$/;
const RE_CIKIS = /^sicil(\d{6})x$/;
const sayi = (x) => Number(x ?? 0) || 0;

function durumYukle() {
  if (existsSync(DURUM_DOSYASI)) return JSON.parse(readFileSync(DURUM_DOSYASI, "utf8"));
  return { kasa: SICIL_KASASI, sonBlok: null, muhurler: {}, aciklamalar: {}, emirler: {}, puanlar: {}, sonAttest: null };
}
const durumKaydet = (d) => writeFileSync(DURUM_DOSYASI, JSON.stringify(d, null, 1));

// ------------------------------------------------------------------ 1. zincir

async function zinciriGuncelle(d) {
  const son = await publicClient.getBlockNumber();
  const bas = d.sonBlok ? BigInt(d.sonBlok) + 1n : KASA_DEPLOY_BLOGU;
  if (bas <= son) {
    for (const e of await kasaOlaylari(bas, son)) {
      const id = String(e.args.id ?? "");
      if (e.eventName === "Sealed") {
        d.muhurler[id] = { id: Number(id), commitHash: e.args.commitHash, pair: e.args.pair, notionalCent: Number(e.args.notionalCent), ts: Number(e.args.ts), tx: e.transactionHash };
      } else if (e.eventName === "Revealed") {
        d.aciklamalar[id] = {
          side: Number(e.args.side), priceE8: String(e.args.priceE8), sizeE8: String(e.args.sizeE8), thesis: e.args.thesis,
          confidence: Number(e.args.confidence), okxOrdId: e.args.okxOrdId, tx: e.transactionHash,
        };
      }
    }
    d.sonBlok = String(son);
  }
  const blok = await publicClient.getBlock({ blockNumber: son });
  return Number(blok.timestamp);
}

// ------------------------------------------------------------------ 2. OKX

async function tumDolumlar(okx, beginMs, endMs) {
  const hepsi = [];
  let after;
  for (let sayfa = 0; sayfa < 50; sayfa++) {
    const s = await okx.call("spot_get_fills", { begin: String(beginMs), end: String(endMs), limit: 100, ...(after ? { after } : {}) });
    hepsi.push(...s);
    if (s.length < 100) break;
    after = s.at(-1).billId;
  }
  return hepsi.filter((f) => sayi(f.fillTime || f.ts) >= beginMs && sayi(f.fillTime || f.ts) <= endMs);
}

async function emirKaydi(okx, d, instId, ordId) {
  const onbellek = d.emirler[ordId];
  if (onbellek && ["filled", "canceled", "mmp_canceled"].includes(onbellek.state)) return onbellek;
  const [o] = await okx.call("spot_get_order", { instId, ordId });
  const k = {
    instId: o.instId, ordId: o.ordId, clOrdId: o.clOrdId ?? "", algoId: o.algoId ?? "", algoClOrdId: o.algoClOrdId ?? "",
    side: o.side, ordType: o.ordType, state: o.state, cTime: sayi(o.cTime), accFillSz: o.accFillSz, avgPx: o.avgPx, tag: o.tag ?? "",
  };
  d.emirler[ordId] = k;
  return k;
}

async function ocoGecmisi(okx) {
  const harita = {};
  const liste = await okx.call("spot_get_algo_orders", { ordType: "oco", status: "history", state: "effective", limit: 100 });
  for (const a of liste) {
    harita[a.algoId] = { algoId: a.algoId, algoClOrdId: a.algoClOrdId ?? "", cTime: sayi(a.cTime), ordIdList: a.ordIdList ?? (a.ordId ? [a.ordId] : []), instId: a.instId };
  }
  return harita;
}

// ------------------------------------------------------------------ 3-4. eşleştirme + net getiri

export function eslestir(d, baslangic, gruplar, emirler, oco) {
  const islemler = {}; // mühür id → { giris, cikislar }
  const eslesmeyenler = [];
  const eslesen = [];
  const reddet = (o, neden, tutar) => eslesmeyenler.push({ ordId: o.ordId, instId: o.instId, side: o.side, clOrdId: o.clOrdId, algoClOrdId: o.algoClOrdId, algoId: o.algoId, cTime: o.cTime, dolumUsdt: +tutar.toFixed(4), neden });

  const ozet = (ordId) => {
    const f = gruplar[ordId];
    const base = f[0].instId.split("-")[0];
    let qty = 0, usdt = 0, ucretBase = 0, ucretQuote = 0;
    for (const x of f) {
      qty += sayi(x.fillSz);
      usdt += sayi(x.fillPx) * sayi(x.fillSz);
      if (x.feeCcy === base) ucretBase += Math.abs(sayi(x.fee));
      else ucretQuote += Math.abs(sayi(x.fee));
    }
    return { qty, usdt, ucretBase, ucretQuote, ort: qty ? usdt / qty : 0, dolum: f.length };
  };

  // Önce girişler (çıkışlar girişe bağlıdır)
  const sirali = Object.keys(gruplar).sort((a, b) => (RE_GIRIS.test(emirler[a].clOrdId) ? 0 : 1) - (RE_GIRIS.test(emirler[b].clOrdId) ? 0 : 1));
  for (const ordId of sirali) {
    const o = emirler[ordId];
    const z = ozet(ordId);
    const g = RE_GIRIS.exec(o.clOrdId);
    const c = RE_CIKIS.exec(o.algoClOrdId);
    if (g) {
      const id = String(Number(g[1]));
      const m = d.muhurler[id];
      if (!m) { reddet(o, `mühür #${id} zincirde yok`, z.usdt); continue; }
      if (m.ts < baslangic) { reddet(o, `mühür #${id} sicilBaslangic'ten önce`, z.usdt); continue; }
      if (m.ts * 1000 >= o.cTime) { reddet(o, `mühür #${id} emirden sonra (${m.ts * 1000} ≥ ${o.cTime})`, z.usdt); continue; }
      if (o.side !== "buy") { reddet(o, "giriş emri alış değil (spotta açığa satış yok)", z.usdt); continue; }
      if (z.usdt * 100 > m.notionalCent + 1 + 1e-6) { reddet(o, `dolum tutarı ${z.usdt.toFixed(4)} USDT > mühür ${m.notionalCent / 100} USDT`, z.usdt); continue; }
      if (m.pair !== o.instId) { reddet(o, `parite uyuşmuyor: mühür ${m.pair}, emir ${o.instId}`, z.usdt); continue; }
      islemler[id] = { id: Number(id), pair: m.pair, giris: { ordId, ...z }, cikislar: [] };
      eslesen.push({ ordId, tur: "giris", muhur: Number(id) });
    } else if (c) {
      const id = String(Number(c[1]));
      const m = d.muhurler[id];
      const a = o.algoId ? oco[o.algoId] : null;
      if (!o.algoId) { reddet(o, "çıkış etiketi var ama algoId yok", z.usdt); continue; }
      if (!a) { reddet(o, `algoId ${o.algoId} OCO geçmişinde yok`, z.usdt); continue; }
      if (a.algoClOrdId !== o.algoClOrdId) { reddet(o, `algoClOrdId uyuşmuyor (${a.algoClOrdId} ≠ ${o.algoClOrdId})`, z.usdt); continue; }
      if (!a.ordIdList.includes(ordId)) { reddet(o, "ordId, algonun ordIdList'inde yok", z.usdt); continue; }
      if (a.cTime < baslangic * 1000) { reddet(o, "OCO sicilBaslangic'ten önce oluşturulmuş", z.usdt); continue; }
      if (!m) { reddet(o, `mühür #${id} zincirde yok`, z.usdt); continue; }
      if (m.ts < baslangic) { reddet(o, `mühür #${id} sicilBaslangic'ten önce`, z.usdt); continue; }
      if (m.ts * 1000 >= a.cTime) { reddet(o, `mühür #${id}, OCO'dan sonra`, z.usdt); continue; }
      const isl = islemler[id];
      if (!isl) { reddet(o, `mühür #${id} girişi eşleşmemiş`, z.usdt); continue; }
      if (o.side !== "sell") { reddet(o, "çıkış emri satış değil", z.usdt); continue; }
      const satilan = isl.cikislar.reduce((t, x) => t + x.qty, 0) + z.qty;
      if (satilan > isl.giris.qty + 1e-9) { reddet(o, `çıkış miktarı ${satilan} > giriş ${isl.giris.qty}`, z.usdt); continue; }
      isl.cikislar.push({ ordId, algoId: o.algoId, ...z });
      eslesen.push({ ordId, tur: "cikis", muhur: Number(id) });
    } else {
      reddet(o, "mühür etiketi yok (clOrdId/algoClOrdId)", z.usdt);
    }
  }
  return { islemler, eslesen, eslesmeyenler };
}

export function netGetiri(islemler, sonFiyat) {
  let toplam = 0;
  for (const isl of Object.values(islemler)) {
    const g = isl.giris;
    const satilan = isl.cikislar.reduce((t, x) => t + x.qty, 0);
    const gelir = isl.cikislar.reduce((t, x) => t + x.usdt, 0);
    const cikisUcretQuote = isl.cikislar.reduce((t, x) => t + x.ucretQuote, 0);
    const elde = Math.max(0, g.qty - g.ucretBase - satilan); // alış ücreti taban birimde kesilir
    const fiyat = sonFiyat[isl.pair] ?? 0;
    isl.acikMiktar = +elde.toFixed(8);
    isl.isaretFiyati = fiyat;
    isl.pnlUsdt = +(gelir + elde * fiyat - g.usdt - g.ucretQuote - cikisUcretQuote).toFixed(6);
    toplam += isl.pnlUsdt;
  }
  return toplam;
}

// ------------------------------------------------------------------ 5. tez puanlama

async function tezPuanla(okx, d, baslangic, simdi) {
  const pencere = Number(await readKasa("aciklamaPenceresiSn"));
  const tezler = [];
  for (const m of Object.values(d.muhurler)) {
    if (m.ts < baslangic) continue; // sicil öncesi test mühürleri tamamen yok sayılır
    const id = String(m.id);
    const r = d.aciklamalar[id];
    if (!r) {
      const durum = simdi > m.ts + pencere ? "tutmadi" : "aciklama-bekleniyor";
      tezler.push({ id: m.id, pair: m.pair, sonuc: durum, neden: durum === "tutmadi" ? "açıklama penceresi doldu, reveal yok" : "", guven: null, acilmamis: durum === "tutmadi" });
      continue;
    }
    if (d.puanlar[id]) { tezler.push(d.puanlar[id]); continue; }
    let t;
    try { t = JSON.parse(r.thesis); } catch { t = null; }
    const giris = Number(r.priceE8) / 1e8;
    const hedef = Number(t?.hedef) || giris * (1 + Number(t?.hedefPct ?? 0) / 100);
    const stop = Number(t?.stop) || giris * (1 - Number(t?.gecersizlikPct ?? 0) / 100);
    const sureDk = Number(t?.sureDk) || 120;
    const bitis = m.ts + sureDk * 60;
    const kayit = { id: m.id, pair: m.pair, guven: r.confidence, sureDk, giris, hedef: +hedef.toFixed(2), stop: +stop.toFixed(2), basTs: m.ts, bitisTs: bitis };
    if (!t || !(hedef > giris) || !(stop < giris)) { Object.assign(kayit, { sonuc: "tutmadi", neden: "tez okunamadı veya hedef/stop geçersiz" }); d.puanlar[id] = kayit; tezler.push(kayit); continue; }
    if (simdi < bitis) { tezler.push({ ...kayit, sonuc: "bekliyor" }); continue; }
    // 1 dakikalık demo mumları: [basTs, bitisTs) aralığı, eskiden yeniye
    const ham = await okx.call("market_get_candles", { instId: m.pair, bar: "1m", after: String(bitis * 1000 + 60_000), limit: sureDk + 5, demo: true });
    const mumlar = ham.map((x) => ({ ts: sayi(x[0]), h: sayi(x[2]), l: sayi(x[3]) }))
      .filter((x) => x.ts >= Math.floor(m.ts / 60) * 60_000 && x.ts < bitis * 1000).sort((a, b) => a.ts - b.ts);
    let sonuc = "tutmadi", neden = "süre doldu, hedefe ulaşılmadı";
    for (const x of mumlar) {
      const h = x.h >= hedef, s = x.l <= stop;
      if (h && s) { neden = "hedef ve stop aynı mumda (belirsiz → tutmadı)"; break; }
      if (s) { neden = `stop önce: ${new Date(x.ts).toISOString()}`; break; }
      if (h) { sonuc = "tuttu"; neden = `hedef önce: ${new Date(x.ts).toISOString()}`; break; }
    }
    Object.assign(kayit, { sonuc, neden, mumSayisi: mumlar.length });
    d.puanlar[id] = kayit;
    tezler.push(kayit);
  }
  // Brier: açıklanmamış mühürler güven = 100 ile girer (gizlemek kalibrasyonu güzelleştiremez)
  const puanli = tezler.filter((x) => x.sonuc === "tuttu" || x.sonuc === "tutmadi");
  const brier = puanli.length
    ? puanli.reduce((t, x) => t + ((x.acilmamis ? 1 : (x.guven ?? 100) / 100) - (x.sonuc === "tuttu" ? 1 : 0)) ** 2, 0) / puanli.length
    : null;
  return { tezler: tezler.sort((a, b) => a.id - b.id), brier, unrevealedExpired: tezler.filter((x) => x.acilmamis).length };
}

// ------------------------------------------------------------------ tur

async function tur(ctx) {
  const { okx, denetci, d } = ctx;
  const baslangic = Number(await readKasa("sicilBaslangic"));
  if (!baslangic) { log("denetim-atlandi", { neden: "sicilBaslangic ayarlı değil" }); return; }
  const anlik = Date.now();
  const zincirTs = await zinciriGuncelle(d);
  const upToTs = Math.min(Math.floor(anlik / 1000), zincirTs - 2);
  const sonDenetim = Number(await readKasa("sonDenetimTs"));
  if (upToTs <= sonDenetim) { durumKaydet(d); return; }

  const dolumlar = await tumDolumlar(okx, baslangic * 1000, upToTs * 1000);
  const gruplar = {};
  for (const f of dolumlar) (gruplar[f.ordId] ??= []).push(f);
  const emirler = {};
  for (const [ordId, f] of Object.entries(gruplar)) emirler[ordId] = await emirKaydi(okx, d, f[0].instId, ordId);
  const oco = await ocoGecmisi(okx);
  const { islemler, eslesen, eslesmeyenler } = eslestir(d, baslangic, gruplar, emirler, oco);

  const sonFiyat = {};
  for (const pair of new Set(Object.values(islemler).map((x) => x.pair))) {
    const [t] = await okx.call("market_get_ticker", { instId: pair, demo: true });
    sonFiyat[pair] = sayi(t.last);
  }
  const netPnl = netGetiri(islemler, sonFiyat);
  const dayPnlCent = Math.round(netPnl * 100);
  const { tezler, brier, unrevealedExpired } = await tezPuanla(okx, d, baslangic, upToTs);
  const muhurSayisi = Object.values(d.muhurler).filter((m) => m.ts >= baslangic).length;

  const ozet = {
    islemHacmiUsdt: +Object.values(islemler).reduce((t, x) => t + x.giris.usdt, 0).toFixed(4),
    muhur: muhurSayisi, aciklanan: tezler.filter((x) => x.sonuc !== "aciklama-bekleniyor" && !x.acilmamis).length,
    emir: Object.keys(gruplar).length, dolum: dolumlar.length, eslesen: eslesen.length, eslesmeyen: eslesmeyenler.length,
    unrevealedExpired, netPnlUsdt: +netPnl.toFixed(4), dayPnlCent,
    tez: { tuttu: tezler.filter((x) => x.sonuc === "tuttu").length, tutmadi: tezler.filter((x) => x.sonuc === "tutmadi").length, bekliyor: tezler.filter((x) => x.sonuc === "bekliyor" || x.sonuc === "aciklama-bekleniyor").length },
    brier: brier === null ? null : +brier.toFixed(4),
  };
  // Hemen attest: yapısal değişiklik (dolum, mühür, açıklama, eşleşme, tez sonucu) veya günlük zarar limiti.
  // Sadece açık pozisyonun anlık değeri değiştiyse en geç KALP_ATISI_MS'de bir.
  const yapi = (o) => (o ? JSON.stringify({ ...o, netPnlUsdt: undefined, dayPnlCent: undefined }) : null);
  const degisti = yapi(ozet) !== yapi(d.sonAttest?.ozet);
  const limit = dayPnlCent <= -Number(ctx.maxGunlukZararCent);
  const kalpAtisi = !d.sonAttest || anlik - d.sonAttest.ms > KALP_ATISI_MS || limit;
  log("denetim", { upToTs, ...ozet, eslesmeyenler: eslesmeyenler.map((x) => `${x.ordId}: ${x.neden}`), degisti });
  if (!degisti && !kalpAtisi) { durumKaydet(d); return; }

  const rapor = {
    surum: 1, kontrat: SICIL_KASASI, zincir: "avalanche-fuji", denetci: denetci.account.address,
    sicilBaslangic: baslangic, upToTs, uretildi: new Date(anlik).toISOString(),
    kural: "techContext.md: Denetçinin dolum eşleştirme prosedürü; net getiri sadece mühürlü dolumlardan; tez: 1m demo mumları, önce hedef mi stop mu",
    ozet, eslesmeyenler,
    islemler: Object.values(islemler).sort((a, b) => a.id - b.id),
    tezler,
  };
  mkdirSync(RAPOR_DIR, { recursive: true });
  const dosya = new URL(`${upToTs}.json`, RAPOR_DIR);
  const metin = JSON.stringify(rapor, null, 1) + "\n";
  writeFileSync(dosya, metin);
  const reportHash = keccak256(new TextEncoder().encode(metin));

  if (opt.kuru) {
    log("attest-kuru", { rapor: `reports/${upToTs}.json`, reportHash });
  } else {
    const r = await writeKasa(denetci, "attest", [BigInt(upToTs), BigInt(eslesen.length), BigInt(eslesmeyenler.length), BigInt(unrevealedExpired), BigInt(dayPnlCent), reportHash]);
    const bozuldu = r.events.some((e) => e.eventName === "SicilBozuldu");
    const fren = r.events.some((e) => e.eventName === "Paused");
    log("attest", { upToTs, rapor: `reports/${upToTs}.json`, reportHash, tx: r.hash, url: snowtrace(r.hash), sicilBozuldu: bozuldu, otomatikFren: fren });
    d.sonAttest = { ms: anlik, upToTs, ozet, tx: r.hash, reportHash };
  }
  durumKaydet(d);
}

/// reports/ klasörünü commit + push (sadece bu klasör). feedbackURI'nin çözülebilmesi için not vermeden önce çağrılır.
function raporlariYayinla() {
  const git = (...a) => execFileSync("git", ["-C", REPO_KOK, ...a], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  // Kodlama oturumuyla çakışmasın: git meşgulse bu saati atla
  if (existsSync(new URL("../../.git/index.lock", import.meta.url))) throw new Error("git meşgul (index.lock)");
  git("add", "reports");
  const bekleyen = git("diff", "--cached", "--name-only", "--", "reports").trim();
  if (!bekleyen) return { yeni: 0 };
  git("commit", "-m", `denetçi: ${bekleyen.split("\n").length} rapor`, "--", "reports");
  git("pull", "--rebase", "--autostash", "-q");
  git("push", "-q");
  return { yeni: bekleyen.split("\n").length, commit: git("rev-parse", "--short", "HEAD").trim() };
}

/// Saatte bir ERC-8004 Reputation: (1) net getiri, işlem hacmine oranla, yüzde (valueDecimals 2 → değer = baz puan)
/// (2) kalibrasyon: Brier skoru (valueDecimals 4). feedbackURI = repodaki rapor, feedbackHash = attest'teki rapor hash'i.
async function itibarNotu(ctx) {
  const { d, denetci } = ctx;
  const a = d.sonAttest;
  if (opt.kuru || !a?.reportHash) return;
  if (d.sonNot && Date.now() - d.sonNot.ms < NOT_ARALIGI_MS) return;
  let yayin;
  try {
    yayin = raporlariYayinla();
  } catch (e) {
    // Push olmadan feedbackURI çözülmez: bu saati atla, bir sonraki saatte tekrar dene
    log("rapor-yayin-hata", { hata: e.message.slice(0, 300), not: "bir sonraki saate bırakıldı" });
    d.sonNot = { ...(d.sonNot ?? {}), ms: Date.now(), atlandi: true };
    durumKaydet(d);
    return;
  }
  const uri = RAPOR_URL(a.upToTs);
  const endpoint = `eip155:43113:${SICIL_KASASI}`;
  const notlar = [];
  if (a.ozet.islemHacmiUsdt > 0) {
    const bps = Math.round((a.ozet.netPnlUsdt / a.ozet.islemHacmiUsdt) * 10_000);
    notlar.push({ ad: "net-getiri", value: BigInt(bps), decimals: 2, tag1: "net-getiri", tag2: "sicil" });
  }
  if (a.ozet.brier !== null && a.ozet.brier !== undefined) {
    notlar.push({ ad: "kalibrasyon", value: BigInt(Math.round(a.ozet.brier * 10_000)), decimals: 4, tag1: "kalibrasyon-brier", tag2: "sicil" });
  }
  const txler = {};
  for (const n of notlar) {
    const hash = await denetci.writeContract({
      address: REPUTATION, abi: REPUTATION_ABI, functionName: "giveFeedback",
      args: [TRADER_AGENT_ID, n.value, n.decimals, n.tag1, n.tag2, endpoint, uri, a.reportHash],
    });
    const rc = await _pc.waitForTransactionReceipt({ hash });
    if (rc.status !== "success") throw new Error(`giveFeedback ${n.ad} başarısız: ${snowtrace(hash)}`);
    txler[n.ad] = hash;
    log("itibar-notu", { not: n.ad, agentId: Number(TRADER_AGENT_ID), value: Number(n.value), valueDecimals: n.decimals, feedbackURI: uri, feedbackHash: a.reportHash, tx: hash, url: snowtrace(hash) });
  }
  d.sonNot = { ms: Date.now(), upToTs: a.upToTs, txler, yayin, notSayisi: notlar.length };
  durumKaydet(d);
}

async function main() {
  const okx = await connectOkx({ profile: "denetci", modules: "spot,market", readOnly: true, name: "sicil-denetci" });
  const ctx = { okx, denetci: walletFor("sicil-denetci"), d: durumYukle(), maxGunlukZararCent: await readKasa("maxGunlukZararCent") };
  log("denetci-basladi", { kasa: SICIL_KASASI, adres: ctx.denetci.account.address, aralikSn: Number(opt.aralik), kuru: opt.kuru });
  let dur = false;
  for (const s of ["SIGTERM", "SIGINT"]) process.on(s, () => { dur = true; });
  try {
    for (;;) {
      try { await tur(ctx); } catch (e) { log("denetim-hata", { hata: e.message, oneri: e.okx?.suggestion }); }
      try { await itibarNotu(ctx); } catch (e) { log("itibar-hata", { hata: e.message.slice(0, 300) }); }
      if (opt["tek-tur"] || dur) break;
      await new Promise((r) => setTimeout(r, Number(opt.aralik) * 1000));
      if (dur) break;
    }
  } finally {
    await okx.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    log("denetci-hata", { hata: e.message });
    process.exitCode = 1;
  });
}
