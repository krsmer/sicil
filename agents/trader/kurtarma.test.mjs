// Çökme sonrası açılış kurtarma: node --test trader/kurtarma.test.mjs
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { bekleyenDeposu } from "../shared/bekleyen.mjs";
import { bekleyenleriTamamla } from "./kurtarma.mjs";

const SIMDI = 1_792_240_000_000;
const tezJSON = JSON.stringify({ kaynak: "ajan", hedefPct: 0.78, gecersizlikPct: 0.59, sureDk: 90, guven: 64 });
const kayit = (h, ek = {}) => ({
  commitHash: h, pair: "BTC-USDT", notionalCent: "1400", side: 0, priceE8: "8157220000000", sizeE8: "17162",
  thesis: tezJSON, confidence: 64, salt: "0x" + "ab".repeat(32), olusturuldu: new Date(SIMDI - 60_000).toISOString(), ...ek,
});
const yeniDepo = () => bekleyenDeposu(pathToFileURL(join(mkdtempSync(join(tmpdir(), "sicil-")), "bekleyen.json")));

function sahteKasa(muhurler, pencereSn = 10800) {
  const revealler = [];
  return {
    revealler,
    muhurSayisi: async () => BigInt(Object.keys(muhurler).length),
    muhur: async (id) => muhurler[id] ?? { commitHash: "0x0", ts: 0n, acik: false },
    pencereSn: BigInt(pencereSn),
    reveal: async (args) => { revealler.push(args); return { hash: `0xrev${args[0]}` }; },
  };
}
function sahteOkx(emirler = {}, algolar = []) {
  const cagrilar = [];
  return {
    cagrilar,
    call: async (arac, a) => {
      cagrilar.push([arac, a]);
      if (arac === "spot_get_order") {
        const o = a.clOrdId ? emirler[a.clOrdId] : Object.values(emirler).find((x) => x.ordId === a.ordId);
        if (!o) throw new Error("Order does not exist");
        return [o];
      }
      if (arac === "spot_cancel_order") { const o = Object.values(emirler).find((x) => x.ordId === a.ordId); o.state = "canceled"; return [{ sCode: "0" }]; }
      if (arac === "spot_get_algo_orders") return algolar;
      throw new Error(`beklenmeyen araç ${arac}`);
    },
  };
}

test("mühürlenmiş, açılmamış, dolmuş emir → kayıttaki değerlerle reveal + OCO, kayıt silinir", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0xaa", { id: 3 }));
  const kasa = sahteKasa({ 1: {}, 2: {}, 3: { commitHash: "0xaa", ts: BigInt(SIMDI / 1000 - 600), acik: false } });
  const okx = sahteOkx({ sicil000003: { ordId: "O3", state: "filled", accFillSz: "0.00017162", avgPx: "81572.2", fee: "-0.0000001", feeCcy: "BTC" } });
  const ocolar = [];
  const r = await bekleyenleriTamamla({ okx, kasa, depo, ocoKoy: async (_o, a) => { ocolar.push(a); return { algoId: "A3" }; }, simdi: SIMDI });
  assert.equal(r[0].islem, "acildi");
  assert.deepEqual(kasa.revealler[0], [3n, 0, 8157220000000n, 17162n, tezJSON, 64, "0x" + "ab".repeat(32), "O3"]);
  assert.equal(ocolar[0].clOrdId, "sicil000003");
  assert.equal(ocolar[0].tpPct, 0.78);
  assert.equal(depo.liste().length, 0);
});

test("mühür no kaydedilmeden çökmüş → commitHash ile bulunur, emir hiç gitmemiş → okxOrdId boş reveal", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0xbb"));
  const kasa = sahteKasa({ 1: { commitHash: "0x11", ts: 1n, acik: true }, 2: { commitHash: "0xbb", ts: BigInt(SIMDI / 1000 - 100), acik: false } });
  const r = await bekleyenleriTamamla({ okx: sahteOkx(), kasa, depo, ocoKoy: async () => assert.fail("OCO olmamalı"), simdi: SIMDI });
  assert.equal(r[0].id, 2);
  assert.equal(kasa.revealler[0][7], "");
  assert.equal(depo.liste().length, 0);
});

test("canlı (dolmamış) emir → önce iptal, sonra reveal; dolum yoksa OCO yok", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0xcc", { id: 1 }));
  const okx = sahteOkx({ sicil000001: { ordId: "O1", state: "live", accFillSz: "0" } });
  const kasa = sahteKasa({ 1: { commitHash: "0xcc", ts: BigInt(SIMDI / 1000 - 100), acik: false } });
  await bekleyenleriTamamla({ okx, kasa, depo, ocoKoy: async () => assert.fail("OCO olmamalı"), simdi: SIMDI });
  assert.ok(okx.cagrilar.some(([a]) => a === "spot_cancel_order"));
  assert.equal(kasa.revealler[0][7], "O1");
});

test("açıklama penceresi dolmuş → reveal YOK (tutmadı sayılır), kayıt silinir", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0xdd", { id: 1 }));
  const kasa = sahteKasa({ 1: { commitHash: "0xdd", ts: BigInt(SIMDI / 1000 - 10801), acik: false } });
  const r = await bekleyenleriTamamla({ okx: sahteOkx(), kasa, depo, ocoKoy: async () => {}, simdi: SIMDI });
  assert.match(r[0].neden, /pencere/);
  assert.equal(kasa.revealler.length, 0);
  assert.equal(depo.liste().length, 0);
});

test("zaten açık mühür → reveal yok, kayıt silinir; OCO zaten varsa yenisi konmaz", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0xee", { id: 1 }));
  depo.ekle(kayit("0xff", { id: 2 }));
  const kasa = sahteKasa({ 1: { commitHash: "0xee", ts: BigInt(SIMDI / 1000 - 50), acik: true }, 2: { commitHash: "0xff", ts: BigInt(SIMDI / 1000 - 50), acik: false } });
  const okx = sahteOkx({ sicil000002: { ordId: "O2", state: "filled", accFillSz: "0.0001", avgPx: "81000", fee: "0", feeCcy: "BTC" } }, [{ algoClOrdId: "sicil000002x" }]);
  await bekleyenleriTamamla({ okx, kasa, depo, ocoKoy: async () => assert.fail("OCO zaten var"), simdi: SIMDI });
  assert.equal(kasa.revealler.length, 1);
  assert.equal(kasa.revealler[0][0], 2n);
  assert.equal(depo.liste().length, 0);
});

test("seal zincire hiç düşmemiş: yeni kayıt beklemede kalır, 10 dk'dan eskisi silinir", async () => {
  const depo = yeniDepo();
  depo.ekle(kayit("0x01", { olusturuldu: new Date(SIMDI - 60_000).toISOString() }));
  depo.ekle(kayit("0x02", { olusturuldu: new Date(SIMDI - 11 * 60_000).toISOString() }));
  const r = await bekleyenleriTamamla({ okx: sahteOkx(), kasa: sahteKasa({ 1: { commitHash: "0x99", ts: 1n, acik: true } }), depo, ocoKoy: async () => {}, simdi: SIMDI });
  assert.deepEqual(r.map((x) => x.islem), ["beklemede", "silindi"]);
  assert.deepEqual(depo.liste().map((k) => k.commitHash), ["0x01"]);
});
