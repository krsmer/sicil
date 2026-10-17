// Sicili başlatır: SicilKasasi.setSicilBaslangic() (sahip, bir kez, block.timestamp).
// Önce hesapta açık emir ve bekleyen algo emir (OCO vb.) OLMADIĞINI kontrol eder. Varsa durur: bir test mührünün OCO'su
// sicil başladıktan sonra tetiklenirse denetçi o dolumu mühürsüz sayar ve kalıcı SicilBozuldu yazar.
//
// Kullanım:  node trader/sicil-baslat.mjs            → sadece kontrol (zincire bir şey göndermez)
//            node trader/sicil-baslat.mjs --onayla   → kontroller temizse setSicilBaslangic() gönderir
import { parseArgs } from "node:util";
import { readKasa, walletFor, writeKasa, snowtrace } from "../shared/chain.mjs";
import { log } from "../shared/log.mjs";
import { connectOkx } from "../shared/okx.mjs";

const { values: opt } = parseArgs({ options: { onayla: { type: "boolean", default: false } } });
const ALGO_TIPLERI = ["conditional", "oco", "move_order_stop"];

async function main() {
  const mevcut = await readKasa("sicilBaslangic");
  if (mevcut !== 0n) {
    log("baslat-zaten", { sicilBaslangic: Number(mevcut), iso: new Date(Number(mevcut) * 1000).toISOString() });
    return;
  }

  // Kontrol denetçinin sadece-okuma süreciyle yapılır
  const okx = await connectOkx({ profile: "denetci", modules: "spot", readOnly: true, name: "sicil-baslat" });
  let acikEmir, bekleyenAlgo;
  try {
    acikEmir = await okx.call("spot_get_orders", { status: "open" });
    bekleyenAlgo = [];
    for (const ordType of ALGO_TIPLERI) bekleyenAlgo.push(...(await okx.call("spot_get_algo_orders", { ordType })));
  } finally {
    await okx.close();
  }
  const ozet = {
    acikEmir: acikEmir.map((o) => ({ instId: o.instId, ordId: o.ordId, clOrdId: o.clOrdId, side: o.side, state: o.state })),
    bekleyenAlgo: bekleyenAlgo.map((a) => ({ instId: a.instId, algoId: a.algoId, algoClOrdId: a.algoClOrdId, ordType: a.ordType, state: a.state })),
  };
  if (acikEmir.length || bekleyenAlgo.length) {
    log("baslat-engellendi", { neden: "hesapta açık emir veya bekleyen algo emir var; önce kapat/iptal et", ...ozet });
    process.exitCode = 2;
    return;
  }
  log("baslat-kontrol-temiz", ozet);

  if (!opt.onayla) {
    log("baslat-kuru", { not: "--onayla verilmedi; setSicilBaslangic gönderilmedi" });
    return;
  }
  const sahip = walletFor("sicil-sahip");
  const r = await writeKasa(sahip, "setSicilBaslangic", []);
  const ts = r.events.find((e) => e.eventName === "SicilBaslangicAyarlandi").args.ts;
  log("baslat", { sicilBaslangic: Number(ts), iso: new Date(Number(ts) * 1000).toISOString(), tx: r.hash, url: snowtrace(r.hash) });
}

main().catch((e) => {
  log("baslat-hata", { hata: e.message, oneri: e.okx?.suggestion });
  process.exitCode = 1;
});
