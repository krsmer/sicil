// node --test trader/sure-cikis.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { sureDolanlar, sureDolanlariKapat, tezSureleri, yakinSeviyeler } from "./sure-cikis.mjs";

const satirlar = [
  { adim: "aday", pair: "BTC-USDT", tez: { sureDk: 90 } },
  { adim: "muhur", id: 2 },
  { adim: "karar" },
  { adim: "aday", pair: "ETH-USDT", tez: { sureDk: 60 } },
  { adim: "muhur", id: 3 },
];

test("tez süreleri: aday → muhur sırasından", () => {
  assert.deepEqual(tezSureleri(satirlar), { 2: { pair: "BTC-USDT", sureDk: 90 }, 3: { pair: "ETH-USDT", sureDk: 60 } });
});

test("sadece süresi dolan sicil OCO'ları seçilir", () => {
  const ocolar = [
    { algoId: "A2", algoClOrdId: "sicil000002x", instId: "BTC-USDT" }, // ts 1000 + 90 dk = 6400 → doldu
    { algoId: "A3", algoClOrdId: "sicil000003x", instId: "ETH-USDT" }, // ts 5000 + 60 dk = 8600 → dolmadı
    { algoId: "B", algoClOrdId: "baska", instId: "BTC-USDT" }, // sicil değil
  ];
  const r = sureDolanlar({ ocolar, sureler: tezSureleri(satirlar), muhurTs: { 2: 1000, 3: 5000 }, simdiSn: 7000 });
  assert.deepEqual(r.map((x) => x.id), [2]);
  assert.equal(r[0].gecikmeSn, 600);
});

test("süre bilinmiyorsa varsayılan 120 dk", () => {
  const r = sureDolanlar({ ocolar: [{ algoId: "A9", algoClOrdId: "sicil000009x" }], sureler: {}, muhurTs: { 9: 100 }, simdiSn: 7299 });
  assert.equal(r.length, 0);
  assert.equal(sureDolanlar({ ocolar: [{ algoId: "A9", algoClOrdId: "sicil000009x" }], sureler: {}, muhurTs: { 9: 100 }, simdiSn: 7300 }).length, 1);
});

test("yakın seviyeler: TP fiyatın üstünde, SL altında, tick'e yuvarlı", () => {
  const { tp, sl } = yakinSeviyeler(81593.2, "0.1");
  assert.equal(tp, "81634.0");
  assert.equal(sl, "81552.4");
  assert.ok(Number(tp) > 81593.2 && Number(sl) < 81593.2);
});

test("kapat: süresi dolan OCO amend edilir (iptal/elle satış YOK), dolmayana dokunulmaz", async () => {
  const cagrilar = [];
  const okx = {
    call: async (arac, a) => {
      cagrilar.push(arac);
      if (arac === "spot_get_algo_orders") return [
        { algoId: "A2", algoClOrdId: "sicil000002x", instId: "BTC-USDT" },
        { algoId: "A3", algoClOrdId: "sicil000003x", instId: "ETH-USDT" },
      ];
      if (arac === "market_get_instruments") return [{ tickSz: "0.1" }];
      if (arac === "market_get_ticker") return [{ last: "81593.2" }];
      if (arac === "spot_amend_algo_order") { assert.equal(a.algoId, "A2"); return [{ sCode: "0" }]; }
      throw new Error(`beklenmeyen araç ${arac}`);
    },
  };
  const loglar = [];
  const r = await sureDolanlariKapat({ okx, muhurTsOku: async (id) => ({ 2: 1000, 3: 5000 })[id], satirlar, log: (a, v) => loglar.push([a, v]), simdiSn: 7000 });
  assert.deepEqual(r.map((x) => x.id), [2]);
  assert.equal(cagrilar.filter((c) => c === "spot_amend_algo_order").length, 1);
  assert.ok(!cagrilar.some((c) => /place_order|cancel/.test(c)));
  assert.equal(loglar[0][0], "sure-doldu-cikis");
});
