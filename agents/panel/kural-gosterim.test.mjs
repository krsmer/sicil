// node --test panel/kural-gosterim.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { dogrula } from "./kural-gosterim.mjs";
const k = (o) => ({ pariteler: ["BTC", "ETH"], islemBasiUsdt: 20, gunlukZararUsdt: 50, desteklenmeyen: [], ...o });
test("geçerli kural → kontrat değerleri", () => {
  const r = dogrula(k());
  assert.ok(r.gecerli);
  assert.deepEqual(r.kontrat, { pariteler: ["BTC-USDT", "ETH-USDT"], maxTutarCent: 2000, maxGunlukZararCent: 5000, beklemeSn: 300, aciklamaPenceresiSn: 10800 });
});
test("izinsiz parite reddedilir", () => assert.match(dogrula(k({ pariteler: ["SOL"] })).hatalar[0], /izinli değil/));
test("işlem başı aralık dışı", () => { assert.ok(!dogrula(k({ islemBasiUsdt: 4 })).gecerli); assert.ok(!dogrula(k({ islemBasiUsdt: 51, gunlukZararUsdt: 100 })).gecerli); });
test("günlük zarar aralık dışı", () => { assert.ok(!dogrula(k({ gunlukZararUsdt: 9 })).gecerli); assert.ok(!dogrula(k({ gunlukZararUsdt: 201 })).gecerli); });
test("günlük zarar işlem başından küçük olamaz", () => assert.ok(dogrula(k({ islemBasiUsdt: 30, gunlukZararUsdt: 20 })).hatalar.some((h) => /küçük olamaz/.test(h))));
test("eksik değer reddedilir", () => assert.ok(!dogrula(k({ gunlukZararUsdt: null })).gecerli));
test("kaldıraç isteği reddedilir", () => assert.ok(!dogrula(k({ desteklenmeyen: ["10x kaldıraç"] })).gecerli));
test("sınırlar dahil", () => { assert.ok(dogrula(k({ islemBasiUsdt: 5, gunlukZararUsdt: 10 })).gecerli); assert.ok(dogrula(k({ islemBasiUsdt: 50, gunlukZararUsdt: 200 })).gecerli); });
