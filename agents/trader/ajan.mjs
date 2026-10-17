// SİCİL trader ajanı: insansız döngü. Her 15 dakikalık mum kapanışında (K-15):
//   kural motoru (1H rejim + 15m giriş) → aday → LLM (Gemini gemini-3.8-flash, en fazla 4 araç / 45 sn; K-16) → AL / BEKLE / PAS
//   AL → boyut = tavan × boyutCarpani → mühür (Sealed onayı) → post_only alış → reveal → OCO çıkış
// Fail-closed: LLM hatası/zaman aşımı → BEKLE; kasa durdurulmuşsa yeni mühür yok; açık pozisyonu olan pariteye yeni giriş yok.
// Ret anı: kural motorunun ham tutarı kontrat limitini aşarsa, en fazla saatte bir, simülasyonsuz mühür gönderilir
// (zincirde reverted kalır); ajan tutarı limite indirip devam eder.
//
// Çalıştırma: node trader/ajan.mjs [--tek-tur]   (GEMINI_API_KEY repo kökündeki .env'den okunur)
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { randomBytes } from "node:crypto";
import { toHex } from "viem";
import { readKasa, sealRetGoster, walletFor } from "../shared/chain.mjs";
import { commitHash } from "../shared/commit.mjs";
import { log } from "../shared/log.mjs";
import { connectOkx } from "../shared/okx.mjs";
import { islemYap } from "./executor.mjs";
import { araclariHazirla, kararVer } from "./karar.mjs";
import { adayUret } from "./kural-motoru.mjs";

const ENV = new URL("../../.env", import.meta.url);
if (existsSync(ENV)) process.loadEnvFile(ENV);

const { values: opt } = parseArgs({ options: { "tek-tur": { type: "boolean", default: false } } });
const PARITELER = ["BTC-USDT", "ETH-USDT"];
const TUR_MS = 15 * 60_000;
const MUM_SONRASI_MS = 20_000; // 15m mum kapandıktan 20 sn sonra
const RET_ARALIGI_MS = 60 * 60_000;
const LOG_DOSYASI = new URL("../logs/trader.jsonl", import.meta.url);

let sonRetMs = 0;
let turda = false;
let durmaIstegi = false;
// Düzgün kapanma: tur ortasında sinyal gelirse tur bitince çıkılır (yarım işlem bırakılmaz)
for (const sinyal of ["SIGTERM", "SIGINT"]) {
  process.on(sinyal, () => {
    durmaIstegi = true;
    log("durma-istegi", { sinyal, turda });
    if (!turda) process.exit(0);
  });
}
const uyu = (ms) => new Promise((r) => setTimeout(r, ms));

/// LLM'e verilecek son 10 tez (yerel log'dan). Sonuçlar denetçi raporlarından gelecek; şimdilik "bekliyor".
function sonTezler() {
  if (!existsSync(LOG_DOSYASI)) return [];
  const satirlar = readFileSync(LOG_DOSYASI, "utf8").trim().split("\n").map((l) => { try { return JSON.parse(l); } catch { return null; } });
  return satirlar
    .filter((s) => s?.adim === "aday" && s.tez?.kaynak === "ajan")
    .slice(-10)
    .map((s) => ({ ts: s.ts, pair: s.pair, guven: s.tez.guven, hedefPct: s.tez.hedefPct, gecersizlikPct: s.tez.gecersizlikPct, sureDk: s.tez.sureDk, sonuc: "bekliyor" }));
}

/// Paritede ajanın açık pozisyonu (bekleyen sicil OCO'su) var mı?
async function acikPozisyon(okx, pair) {
  const algolar = await okx.call("spot_get_algo_orders", { instId: pair, ordType: "oco" });
  return algolar.some((a) => (a.algoClOrdId ?? "").startsWith("sicil"));
}

/// TR demo bağlamı: son 8 adet 15m mum ve emir defterinin ilk 5 kademesi (LLM'e kod üzerinden verilir)
async function trBaglam(okx, pair) {
  const mumlar = await okx.call("market_get_candles", { instId: pair, bar: "15m", limit: 8, demo: true });
  const [defter] = await okx.call("market_get_orderbook", { instId: pair, sz: "5", demo: true });
  return {
    mum15: mumlar.map((m) => ({ ts: new Date(Number(m[0])).toISOString(), o: m[1], h: m[2], l: m[3], c: m[4] })).reverse(),
    defter: { alis: defter.bids.map((b) => [b[0], b[1]]), satis: defter.asks.map((a) => [a[0], a[1]]) },
  };
}

async function tur(ctx) {
  const { okx, piyasa, araclar, trader, maxTutarCent, beklemeSn } = ctx;
  if (await readKasa("durduruldu")) {
    log("tur-atlandi", { neden: "kasa durdurulmuş (fren)" });
    return;
  }
  let muhurlendi = false;
  for (const pair of PARITELER) {
    try {
      if (muhurlendi) {
        // Kontrattaki bekleme süresi (iki mühür arası) dolana kadar bekle, sonra bu pariteyi taze veriyle değerlendir
        const bitis = (Number(await readKasa("sonMuhurTs")) + Number(beklemeSn)) * 1000 + 5_000;
        const kalan = bitis - Date.now();
        if (kalan > 0) {
          log("bekleme", { pair, sn: Math.ceil(kalan / 1000), neden: "mühürler arası bekleme kuralı" });
          await uyu(kalan);
        }
        if (await readKasa("durduruldu")) {
          log("tur-atlandi", { pair, neden: "kasa durdurulmuş (fren)" });
          return;
        }
      }
      if (await acikPozisyon(okx, pair)) {
        log("tur-atlandi", { pair, neden: "açık pozisyon var (bekleyen OCO)" });
        continue;
      }
      const { durum, aday, neden } = await adayUret(okx, pair, { maxTutarUsdt: Number(maxTutarCent) / 100 });
      if (!aday) {
        log("aday-yok", { pair, neden, durum });
        continue;
      }
      const baglam = await trBaglam(okx, pair);
      const k = await kararVer({ aday, durum, baglam, gecmis: sonTezler(), araclar, piyasaOkx: piyasa });
      log("karar", { pair, aday, karar: k.karar, boyutCarpani: k.boyutCarpani, guven: k.guven, sureDk: k.sureDk, gerekce: k.gerekce, gecerli: k.gecerli, model: k.model, aracCagrilari: k.aracCagrilari, sureMs: k.sureMs, kullanim: k.kullanim });
      if (k.karar !== "AL" || k.boyutCarpani <= 0) continue;

      // Ret anı: ham tutar limiti aşıyorsa (saatte en fazla bir kez) simülasyonsuz mühür → zincirde reverted
      const hamCent = BigInt(Math.round(aday.hamTutarUsdt * 100));
      if (hamCent > maxTutarCent && Date.now() - sonRetMs > RET_ARALIGI_MS) {
        sonRetMs = Date.now();
        const h = commitHash({ pair, side: 0, priceE8: BigInt(Math.round(aday.giris * 1e8)), sizeE8: 0n, thesis: "ret", confidence: 0, salt: toHex(randomBytes(32)) });
        const r = await sealRetGoster(trader, h, pair, hamCent);
        log("ret", { pair, hamTutarUsdt: aday.hamTutarUsdt, limitUsdt: Number(maxTutarCent) / 100, status: r.status, tx: r.hash, url: r.url });
      }

      const notionalCent = BigInt(Math.floor(aday.tavanUsdt * k.boyutCarpani * 100));
      if (notionalCent < 500n) {
        log("tur-atlandi", { pair, neden: `boyut çok küçük (${Number(notionalCent) / 100} USDT)` });
        continue;
      }
      const tez = {
        kaynak: "ajan", pair, tur: aday.tur, giris: aday.giris, stop: aday.stop, hedef: aday.hedef,
        hedefPct: aday.hedefPct, gecersizlikPct: aday.gecersizlikPct, sureDk: k.sureDk, guven: k.guven, gerekce: k.gerekce,
      };
      await islemYap(okx, trader, { pair, notionalCent, tez, fillTimeoutSn: 600 });
      muhurlendi = true;
    } catch (e) {
      log("tur-hata", { pair, hata: e.message, oneri: e.okx?.suggestion });
    }
  }
}

async function main() {
  const okx = await connectOkx({ profile: "demo", modules: "spot,account,market", name: "sicil-yurutucu" });
  const piyasa = await connectOkx({ profile: "piyasa", modules: "market", readOnly: true, name: "sicil-llm-arastirma" });
  const ctx = {
    okx, piyasa, araclar: await araclariHazirla(piyasa), trader: walletFor("sicil-trader"),
    maxTutarCent: await readKasa("maxTutarCent"), beklemeSn: await readKasa("beklemeSn"),
  };
  log("ajan-basladi", { pariteler: PARITELER, llmAraclari: ctx.araclar.map((a) => a.name), maxTutarCent: Number(ctx.maxTutarCent) });
  try {
    for (;;) {
      turda = true;
      await tur(ctx);
      turda = false;
      if (opt["tek-tur"] || durmaIstegi) break;
      const simdi = Date.now();
      const sonraki = Math.ceil(simdi / TUR_MS) * TUR_MS + MUM_SONRASI_MS;
      await new Promise((r) => setTimeout(r, sonraki - simdi));
    }
  } finally {
    await okx.close();
    await piyasa.close();
  }
}

main().catch((e) => {
  log("ajan-hata", { hata: e.message });
  process.exitCode = 1;
});
