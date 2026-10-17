// SİCİL trader yürütücüsü: tek aday için mühür → emir → açıklama → OCO çıkış döngüsü (LLM'siz iskelet).
// Kurallar: mühür zincirde onaylanmadan emir yok; spotta pozisyon sadece ALIŞ ile açılır, satış sadece OCO çıkışıdır;
// post_only fiyatı demo piyasa verisinden; emir aracını sadece bu kod çağırır.
//
// Kullanım (elle tetiklenen aday):
//   node trader/executor.mjs --pair BTC-USDT --usdt 15 --tp-pct 0.5 --sl-pct 0.03 [--fill-timeout 600] [--izle-cikis 1800]
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";
import { toHex } from "viem";
import { walletFor, writeKasa, readKasa, snowtrace } from "../shared/chain.mjs";
import { commitHash } from "../shared/commit.mjs";
import { log } from "../shared/log.mjs";
import { connectOkx } from "../shared/okx.mjs";

const { values: opt } = parseArgs({
  options: {
    pair: { type: "string", default: "BTC-USDT" },
    usdt: { type: "string", default: "15" },
    "tp-pct": { type: "string", default: "0.5" },
    "sl-pct": { type: "string", default: "0.3" },
    "sure-dk": { type: "string", default: "120" },
    guven: { type: "string", default: "50" },
    "fill-timeout": { type: "string", default: "600" },
    "izle-cikis": { type: "string", default: "0" },
  },
});

const SIDE_AL = 0; // spotta giriş sadece alış
const E8 = 100_000_000n;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// "81651.2" → 8165120000000n (1e8 ölçekli, tam sayı). İşaret ayrı ele alınır ("-0.0000001" gibi değerler için).
// 8 haneden fazlası kesilir; yukarı = true ise artık varsa mutlak değer bir birim büyütülür (ücretleri güvenli tarafa yuvarlamak için).
function toE8(s, yukari = false) {
  const str = String(s).trim();
  const neg = str.startsWith("-");
  const [i, f = ""] = str.replace(/^[-+]/, "").split(".");
  let x = BigInt(i || "0") * E8 + BigInt((f + "00000000").slice(0, 8));
  if (yukari && /[1-9]/.test(f.slice(8))) x += 1n;
  return neg ? -x : x;
}
function fromE8(x) {
  const neg = x < 0n;
  const a = neg ? -x : x;
  const f = (a % E8).toString().padStart(8, "0").replace(/0+$/, "");
  return (neg ? "-" : "") + (a / E8).toString() + (f ? "." + f : "");
}
const floorTo = (x, stepE8) => (x / stepE8) * stepE8;

async function main() {
  const pair = opt.pair;
  const notionalCent = BigInt(Math.round(Number(opt.usdt) * 100));
  const tpPct = Number(opt["tp-pct"]);
  const slPct = Number(opt["sl-pct"]);
  const tez = { kaynak: "elle-test", hedefPct: tpPct, gecersizlikPct: slPct, sureDk: Number(opt["sure-dk"]), guven: Number(opt.guven) };
  const thesis = JSON.stringify(tez);
  const confidence = tez.guven;

  const okx = await connectOkx({ profile: process.env.OKX_PROFILE ?? "demo", modules: "spot,account,market", name: "sicil-yurutucu" });
  const trader = walletFor("sicil-trader");

  try {
    if (await readKasa("durduruldu")) throw new Error("kasa durdurulmuş: yeni mühür yok");

    // 1. Fiyat ve boyut: demo piyasa verisinden, kural limitlerine göre
    const [inst] = await okx.call("market_get_instruments", { instType: "SPOT", instId: pair, demo: true });
    const [tk] = await okx.call("market_get_ticker", { instId: pair, demo: true });
    const tickE8 = toE8(inst.tickSz);
    const lotE8 = toE8(inst.lotSz);
    const priceE8 = floorTo(toE8(tk.bidPx), tickE8); // en iyi alışa katıl → maker
    // priceE8 × sizeE8 ≤ notionalCent × 1e14 (kontrattaki tutar tutarlılığı)
    const sizeE8 = floorTo((notionalCent * 100_000_000_000_000n) / priceE8, lotE8);
    if (sizeE8 < toE8(inst.minSz)) throw new Error(`boyut minSz altında: ${fromE8(sizeE8)} < ${inst.minSz}`);
    const salt = toHex(randomBytes(32));
    const hash = commitHash({ pair, side: SIDE_AL, priceE8, sizeE8, thesis, confidence, salt });
    log("aday", { pair, px: fromE8(priceE8), sz: fromE8(sizeE8), notionalCent: Number(notionalCent), tez, commitHash: hash });

    // 2. Mühür: Sealed onayı gelmeden emir yok
    const seal = await writeKasa(trader, "seal", [hash, pair, notionalCent]);
    const id = seal.events.find((e) => e.eventName === "Sealed").args.id;
    const clOrdId = `sicil${String(id).padStart(6, "0")}`;
    log("muhur", { id: Number(id), clOrdId, tx: seal.hash, url: snowtrace(seal.hash) });

    // 3. Emir: post_only alış, clOrdId = mühür no
    let ordId = "";
    try {
      const [o] = await okx.call("spot_place_order", {
        instId: pair, tdMode: "cash", side: "buy", ordType: "post_only", px: fromE8(priceE8), sz: fromE8(sizeE8), clOrdId,
      });
      if (o.sCode !== "0") throw new Error(`emir reddedildi: ${o.sCode} ${o.sMsg}`);
      ordId = o.ordId;
      log("emir", { id: Number(id), clOrdId, ordId });
    } catch (e) {
      log("emir-hata", { id: Number(id), clOrdId, hata: e.message, oneri: e.okx?.suggestion });
    }

    // 4. Dolum bekle; süre dolarsa iptal
    let ord = null;
    if (ordId) {
      const bitis = Date.now() + Number(opt["fill-timeout"]) * 1000;
      for (;;) {
        [ord] = await okx.call("spot_get_order", { instId: pair, ordId });
        if (ord.state === "filled" || ord.state === "canceled") break;
        if (Date.now() > bitis) {
          await okx.call("spot_cancel_order", { instId: pair, ordId }).catch((e) => log("iptal-hata", { hata: e.message }));
          await sleep(1500);
          [ord] = await okx.call("spot_get_order", { instId: pair, ordId });
          log("iptal", { id: Number(id), ordId, state: ord.state, accFillSz: ord.accFillSz });
          break;
        }
        await sleep(5000);
      }
      log("dolum", { id: Number(id), ordId, state: ord.state, accFillSz: ord.accFillSz, avgPx: ord.avgPx, fee: ord.fee, feeCcy: ord.feeCcy });
    }

    // 5. Açıklama: emir gitmese/dolmasa da yapılır
    const rev = await writeKasa(trader, "reveal", [id, SIDE_AL, priceE8, sizeE8, thesis, confidence, salt, ordId]);
    log("aciklama", { id: Number(id), tx: rev.hash, url: snowtrace(rev.hash) });

    // 6. OCO çıkış (sadece satış = çıkış). Alış ücreti taban birimde kesildiyse satılabilir miktar azalır.
    const fillE8 = ord ? toE8(ord.accFillSz || "0") : 0n;
    if (fillE8 > 0n) {
      const baseCcy = pair.split("-")[0];
      // OKX ücreti eksi işaretli döner (ör. "-0.000000146912" BTC); kesilen miktarı yukarı yuvarla
      const feeE8 = ord.feeCcy === baseCcy ? -toE8(ord.fee || "0", true) : 0n;
      const exitE8 = floorTo(fillE8 - (feeE8 > 0n ? feeE8 : 0n), lotE8);
      const avgE8 = toE8(ord.avgPx);
      const tpE8 = floorTo((avgE8 * BigInt(Math.round((100 + tpPct) * 1e6))) / 100_000_000n, tickE8);
      const slE8 = floorTo((avgE8 * BigInt(Math.round((100 - slPct) * 1e6))) / 100_000_000n, tickE8);
      const algoClOrdId = `${clOrdId}x`;
      const [a] = await okx.call("spot_place_algo_order", {
        instId: pair, tdMode: "cash", side: "sell", ordType: "oco", sz: fromE8(exitE8),
        tpTriggerPx: fromE8(tpE8), tpOrdPx: "-1", slTriggerPx: fromE8(slE8), slOrdPx: "-1", algoClOrdId,
      });
      log("oco", { id: Number(id), algoId: a.algoId, algoClOrdId: a.algoClOrdId, sz: fromE8(exitE8), tp: fromE8(tpE8), sl: fromE8(slE8), sCode: a.sCode });

      // 7. (test) OCO tetiklenene kadar izle; çıkış emrinde algoClOrdId/algoId görünüyor mu?
      const izle = Number(opt["izle-cikis"]);
      if (izle > 0) {
        const bitis = Date.now() + izle * 1000;
        while (Date.now() < bitis) {
          const bekleyen = await okx.call("spot_get_algo_orders", { instId: pair, ordType: "oco" });
          if (!bekleyen.some((x) => x.algoId === a.algoId)) break;
          await sleep(10_000);
        }
        const gecmis = await okx.call("spot_get_algo_orders", { instId: pair, ordType: "oco", status: "history", state: "effective" });
        const h = gecmis.find((x) => x.algoId === a.algoId);
        if (!h) {
          log("cikis-yok", { id: Number(id), algoId: a.algoId, not: "izleme süresinde tetiklenmedi" });
        } else {
          const [co] = await okx.call("spot_get_order", { instId: pair, ordId: h.ordId });
          const fills = await okx.call("spot_get_fills", { instId: pair, ordId: h.ordId });
          log("cikis", {
            id: Number(id), algoId: h.algoId, tetiklenen: h.actualSide, cikisOrdId: h.ordId,
            emir: { clOrdId: co.clOrdId, algoId: co.algoId, algoClOrdId: co.algoClOrdId, state: co.state, avgPx: co.avgPx, fee: co.fee },
            dolumlar: fills.map((f) => ({ tradeId: f.tradeId, clOrdId: f.clOrdId, fillPx: f.fillPx, fillSz: f.fillSz, fee: f.fee, algoClOrdId: f.algoClOrdId ?? null, algoId: f.algoId ?? null })),
          });
        }
      }
    }
  } finally {
    await okx.close();
  }
}

main().catch((e) => {
  log("hata", { hata: e.message, oneri: e.okx?.suggestion });
  process.exitCode = 1;
});
