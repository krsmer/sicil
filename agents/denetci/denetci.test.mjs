// Denetçi eşleştirme kuralları: node --test denetci/
import assert from "node:assert/strict";
import { test } from "node:test";
import { eslestir, netGetiri } from "./denetci.mjs";

const BAS = 1_792_231_294; // sicilBaslangic
const ms = (s) => s * 1000;
const d = {
  muhurler: {
    1: { id: 1, pair: "BTC-USDT", notionalCent: 1500, ts: BAS - 1800 }, // sicil öncesi test mührü
    2: { id: 2, pair: "BTC-USDT", notionalCent: 1400, ts: BAS + 60 },
  },
};
const dolum = (ordId, side, px, sz, fee, feeCcy) => ({ ordId, instId: "BTC-USDT", side, fillPx: String(px), fillSz: String(sz), fee: String(fee), feeCcy });
const giris = { ordId: "G2", instId: "BTC-USDT", side: "buy", clOrdId: "sicil000002", algoId: "", algoClOrdId: "", cTime: ms(BAS + 66) };
const cikis = { ordId: "C2", instId: "BTC-USDT", side: "sell", clOrdId: "O123", algoId: "A2", algoClOrdId: "sicil000002x", cTime: ms(BAS + 900) };
const oco = { A2: { algoId: "A2", algoClOrdId: "sicil000002x", cTime: ms(BAS + 120), ordIdList: ["C2"] } };
const temelGruplar = () => ({
  G2: [dolum("G2", "buy", 81572.2, 0.00017162, -0.000000137296, "BTC")],
  C2: [dolum("C2", "sell", 82211.7, 0.00017148, -0.0141, "USDT")],
});

test("giriş + OCO çıkışı eşleşir (etiket + algoId + ordIdList + zaman)", () => {
  const r = eslestir(d, BAS, temelGruplar(), { G2: giris, C2: cikis }, oco);
  assert.equal(r.eslesmeyenler.length, 0);
  assert.deepEqual(r.eslesen.map((x) => x.tur), ["giris", "cikis"]);
});

test("sabahki test OCO'su: aynı sicil000002x etiketi ama algo sicilBaslangic'ten önce → eşleşmez", () => {
  const eskiOco = { A0: { algoId: "A0", algoClOrdId: "sicil000002x", cTime: ms(BAS - 3600), ordIdList: ["C0"] } };
  const gruplar = { C0: [dolum("C0", "sell", 81676, 0.00012, -0.0098, "USDT")] };
  const emir = { C0: { ordId: "C0", instId: "BTC-USDT", side: "sell", clOrdId: "O9", algoId: "A0", algoClOrdId: "sicil000002x", cTime: ms(BAS + 10) } };
  const r = eslestir(d, BAS, gruplar, emir, eskiOco);
  assert.equal(r.eslesmeyenler.length, 1);
  assert.match(r.eslesmeyenler[0].neden, /sicilBaslangic'ten önce/);
});

test("sahte etiket: algoClOrdId sicil000002x ama algoId OCO geçmişinde yok → eşleşmez", () => {
  const sahte = { ...cikis, algoId: "SAHTE" };
  const r = eslestir(d, BAS, temelGruplar(), { G2: giris, C2: sahte }, oco);
  assert.equal(r.eslesmeyenler.length, 1);
  assert.match(r.eslesmeyenler[0].neden, /OCO geçmişinde yok/);
});

test("ordId algonun ordIdList'inde değil → eşleşmez", () => {
  const r = eslestir(d, BAS, temelGruplar(), { G2: giris, C2: cikis }, { A2: { ...oco.A2, ordIdList: ["BASKA"] } });
  assert.match(r.eslesmeyenler[0].neden, /ordIdList/);
});

test("mühürsüz emir (elle işlem) → eşleşmez", () => {
  const gruplar = { X: [dolum("X", "buy", 81600, 0.0001, -0.0000001, "BTC")] };
  const r = eslestir(d, BAS, gruplar, { X: { ordId: "X", instId: "BTC-USDT", side: "buy", clOrdId: "", algoId: "", algoClOrdId: "", cTime: ms(BAS + 500) } }, {});
  assert.match(r.eslesmeyenler[0].neden, /etiketi yok/);
});

test("mühür emirden sonra → eşleşmez", () => {
  const r = eslestir(d, BAS, { G2: temelGruplar().G2 }, { G2: { ...giris, cTime: ms(BAS + 30) } }, {});
  assert.match(r.eslesmeyenler[0].neden, /emirden sonra/);
});

test("sicil öncesi mühürle açılan giriş → eşleşmez", () => {
  const g1 = { ...giris, ordId: "G1", clOrdId: "sicil000001", cTime: ms(BAS + 5) };
  const r = eslestir(d, BAS, { G1: [dolum("G1", "buy", 81000, 0.0001, 0, "BTC")] }, { G1: g1 }, {});
  assert.match(r.eslesmeyenler[0].neden, /sicilBaslangic'ten önce/);
});

test("dolum tutarı mühürü aşarsa → eşleşmez", () => {
  const r = eslestir(d, BAS, { G2: [dolum("G2", "buy", 81572.2, 0.0002, 0, "BTC")] }, { G2: giris }, {}); // 16,31 USDT > 14
  assert.match(r.eslesmeyenler[0].neden, /dolum tutarı/);
});

test("çıkış girişten fazla satamaz", () => {
  const g = temelGruplar();
  g.C2 = [dolum("C2", "sell", 82211.7, 0.0003, -0.02, "USDT")];
  const r = eslestir(d, BAS, g, { G2: giris, C2: cikis }, oco);
  assert.match(r.eslesmeyenler[0].neden, /çıkış miktarı/);
});

test("net getiri sadece mühürlü dolumlardan; alış ücreti BTC'den düşülür", () => {
  const r = eslestir(d, BAS, temelGruplar(), { G2: giris, C2: cikis }, oco);
  const pnl = netGetiri(r.islemler, { "BTC-USDT": 82000 });
  // gelir 82211.7×0.00017148 − maliyet 81572.2×0.00017162 − 0.0141 USDT; elde kalan ≈ 0.000000002703 BTC × 82000
  const beklenen = 82211.7 * 0.00017148 + Math.max(0, 0.00017162 - 0.000000137296 - 0.00017148) * 82000 - 81572.2 * 0.00017162 - 0.0141;
  assert.ok(Math.abs(pnl - beklenen) < 1e-6, `${pnl} ≠ ${beklenen}`);
});
