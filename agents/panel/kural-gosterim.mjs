// "Kuralını yaz" GÖSTERİMİ: kullanıcının Türkçe kuralı → Gemini → sayılar → KOD aralık kontrolü → onay kartı verisi.
// Gerçek deploy YOK. LLM sadece metni sayılara çevirir; kabul/ret kararını aşağıdaki sabit aralıklar verir (Arif onayladı):
//   pariteler: sadece BTC-USDT ve/veya ETH-USDT · işlem başı 5–50 USDT · günlük zarar 10–200 USDT ve ≥ işlem başı
//   bekleme (300 sn) ve açıklama penceresi (3 saat) sistem kuralı, kullanıcı seçmez.
// Gemini anahtarı sadece bu süreçte (process.env); dönen nesnede yalnızca doğrulanmış değerler ve nedenler var.
import { GoogleGenAI } from "@google/genai";

const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
const IZINLI = ["BTC-USDT", "ETH-USDT"];
export const ARALIK = { islemBasi: [5, 50], gunlukZarar: [10, 200] };
const SISTEM = { beklemeSn: 300, aciklamaPenceresiSn: 10800 };

const SEMA = {
  type: "object",
  properties: {
    pariteler: { type: "array", items: { type: "string" }, description: "Kullanıcının istediği coin/pariteler, yazdığı gibi (ör. BTC, ETH, SOL)" },
    islemBasiUsdt: { type: ["number", "null"], description: "İşlem başı en fazla tutar, USDT; belirtilmediyse null" },
    gunlukZararUsdt: { type: ["number", "null"], description: "Günlük en fazla zarar, USDT; belirtilmediyse null" },
    desteklenmeyen: { type: "array", items: { type: "string" }, description: "Kaldıraç, açığa satış, vadeli gibi istenen ama sayı olmayan şeyler" },
  },
  required: ["pariteler", "islemBasiUsdt", "gunlukZararUsdt", "desteklenmeyen"],
  additionalProperties: false,
};
const TALIMAT = `Kullanıcının Türkçe yazdığı alım-satım kuralını sayılara çevir. Sadece kullanıcının açıkça yazdığını çıkar; tahmin etme, varsayılan değer uydurma.
Tutarları USDT olarak ver (TL yazdıysa çevirme, desteklenmeyen listesine "TL tutar" yaz). Kaldıraç, açığa satış, vadeli/futures gibi istekleri "desteklenmeyen" listesine yaz. Yalnızca JSON döndür.`;

let _ai;
const ai = () => (_ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

/// Saf doğrulama (test edilebilir): LLM çıktısı → { gecerli, hatalar, degerler }
export function dogrula(k) {
  const hatalar = [];
  const ham = Array.isArray(k?.pariteler) ? k.pariteler : [];
  const pariteler = [];
  for (const p of ham) {
    const n = String(p).toUpperCase().replace(/\s+/g, "").replace(/[\/_]/g, "-");
    const tam = n.includes("-") ? n : `${n}-USDT`;
    if (IZINLI.includes(tam)) { if (!pariteler.includes(tam)) pariteler.push(tam); }
    else hatalar.push(`"${p}" izinli değil: sadece BTC-USDT ve/veya ETH-USDT (spot)`);
  }
  if (!pariteler.length && !hatalar.length) hatalar.push("Parite belirtilmemiş: BTC ve/veya ETH yazın");
  const ib = k?.islemBasiUsdt, gz = k?.gunlukZararUsdt;
  if (ib == null || !Number.isFinite(Number(ib))) hatalar.push("İşlem başı tutar belirtilmemiş");
  else if (ib < ARALIK.islemBasi[0] || ib > ARALIK.islemBasi[1]) hatalar.push(`İşlem başı ${ib} USDT aralık dışında (${ARALIK.islemBasi[0]}–${ARALIK.islemBasi[1]} USDT)`);
  if (gz == null || !Number.isFinite(Number(gz))) hatalar.push("Günlük zarar limiti belirtilmemiş");
  else if (gz < ARALIK.gunlukZarar[0] || gz > ARALIK.gunlukZarar[1]) hatalar.push(`Günlük zarar ${gz} USDT aralık dışında (${ARALIK.gunlukZarar[0]}–${ARALIK.gunlukZarar[1]} USDT)`);
  if (ib != null && gz != null && Number(gz) < Number(ib)) hatalar.push(`Günlük zarar limiti (${gz}) işlem başı tavandan (${ib}) küçük olamaz`);
  for (const d of k?.desteklenmeyen ?? []) hatalar.push(`Desteklenmiyor: ${d} (SİCİL sadece spot alış yapar)`);
  return {
    gecerli: hatalar.length === 0,
    hatalar,
    degerler: { pariteler, islemBasiUsdt: ib ?? null, gunlukZararUsdt: gz ?? null, ...SISTEM },
    kontrat: hatalar.length ? null : { pariteler, maxTutarCent: Math.round(ib * 100), maxGunlukZararCent: Math.round(gz * 100), beklemeSn: SISTEM.beklemeSn, aciklamaPenceresiSn: SISTEM.aciklamaPenceresiSn },
  };
}

export async function kuralCevir(metin) {
  const t = String(metin ?? "").trim().slice(0, 500);
  if (t.length < 5) return { gosterim: true, gecerli: false, hatalar: ["Kural metni boş ya da çok kısa"] };
  try {
    const r = await ai().models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: t }] }],
      config: { systemInstruction: TALIMAT, responseMimeType: "application/json", responseJsonSchema: SEMA, maxOutputTokens: 1000, httpOptions: { timeout: 20_000 } },
    });
    const k = JSON.parse(r.text ?? "");
    return { gosterim: true, metin: t, anlasilan: k, model: r.modelVersion ?? MODEL, ...dogrula(k) };
  } catch (e) {
    return { gosterim: true, metin: t, gecerli: false, hatalar: [`Yapay zekâ çevirisi başarısız: ${(e?.message ?? String(e)).slice(0, 120)}`] };
  }
}
