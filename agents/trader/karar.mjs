// LLM karar katmanı (K-15, K-16): kural motorunun adayını Gemini araştırır ve AL / BEKLE / PAS der.
// - LLM'in araçları, anahtarı OLMAYAN ayrı bir `okx-trade-mcp --profile piyasa --read-only --modules market` sürecinden
//   gelir (K-11): emir aracı yok, hesap anahtarı yok.
// - Sayıları (giriş, stop, hedef, tavan) kural motoru verir; LLM sadece boyutCarpani (0–1, sadece küçültür), güven ve
//   tez süresi (60–120 dk) seçer.
// - En fazla 4 araç çağrısı, toplam en fazla 45 sn. Aşım, şemaya uymayan cevap, ret veya hata → BEKLE.
import { FunctionCallingConfigMode, GoogleGenAI } from "@google/genai";

export const MODEL = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
export const ARAC_BUTCESI = 4;
export const SURE_MS = 45_000;
const TEZ_MIN_DK = 60;
const TEZ_MAX_DK = 120;

// K-11: LLM'in kullanabildiği global türev/indikatör araçları
export const LLM_ARACLARI = [
  "market_get_funding_rate",
  "market_get_open_interest",
  "market_filter_oi_change",
  "market_filter",
  "market_get_indicator",
];

const KARAR_SEMASI = {
  type: "object",
  properties: {
    karar: { type: "string", enum: ["AL", "BEKLE", "PAS"] },
    boyutCarpani: { type: "number", description: "0-1 arası; tavan tutarın ne kadarı kullanılsın. AL değilse 0." },
    guven: { type: "integer", description: "0-100; tezin tutma olasılığı tahmini" },
    sureDk: { type: "integer", description: "Tez süresi, 60-120 dakika" },
    gerekce: { type: "string", description: "Türkçe, en fazla 3 cümle" },
  },
  required: ["karar", "boyutCarpani", "guven", "sureDk", "gerekce"],
  additionalProperties: false,
};

const SISTEM = `Sen SİCİL'in trader ajanısın. OKX TR spot piyasasında (BTC-USDT, ETH-USDT) sadece ALIŞ yönlü işlem açılır; açığa satış yoktur.
Kural motoru sana bir ADAY verir: giriş fiyatı, zorunlu stop, hedef, tavan tutar ve piyasa durumu. Bu sayıları değiştiremezsin.
Görevin: bu kurulumun işleme değip değmediğine karar vermek.
- AL: Tez, kural motorunun hedefine stoptan ÖNCE ulaşılacağıdır. Bu tez işlemden önce zincire mühürlenir ve süre dolunca bağımsız bir denetçi tarafından kurallı olarak puanlanır.
- BEKLE: Şimdilik karar vermek için yeterli işaret yok.
- PAS: Kurulum kötü; bu adayı reddet.
Karar vermeden önce adayı araştır: en az bir, en fazla ${ARAC_BUTCESI} araç çağrısıyla global OKX türev ve indikatör bağlamını kontrol et (ör. ilgili -USDT-SWAP funding oranı, açık pozisyon, OI değişim taraması, başka zaman dilimi indikatörleri). Kural motorunun verdiği sayıları tekrar hesaplamak için araç çağırma; tezi destekleyen ya da çürüten bağımsız işaret ara.
"guven" tezin tutma olasılığına dair dürüst tahminindir (0-100); geçmiş tezlerinin sonuçlarına göre kalibre et. Aşırı güven Brier skorunla zincirde görünür.
"boyutCarpani" 0 ile 1 arasıdır ve sadece boyutu küçültür. "sureDk" ${TEZ_MIN_DK}-${TEZ_MAX_DK} arasıdır.
Son cevabın yalnızca istenen JSON nesnesi olsun.`;

let _ai;
const ai = () => (_ai ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }));

function bekle(neden, ek = {}) {
  return { karar: "BEKLE", boyutCarpani: 0, guven: 0, sureDk: TEZ_MIN_DK, gerekce: neden, gecerli: false, ...ek };
}

/// MCP araç tanımlarını Gemini functionDeclarations biçimine çevirir (sadece izinli, sadece-okuma olanlar).
export async function araclariHazirla(piyasaOkx) {
  const { tools } = await piyasaOkx.client.listTools();
  return tools
    .filter((t) => LLM_ARACLARI.includes(t.name) && t.annotations?.readOnlyHint)
    .map((t) => ({ name: t.name, description: (t.description ?? "").slice(0, 1000), parametersJsonSchema: t.inputSchema }));
}

/// @returns {{karar, boyutCarpani, guven, sureDk, gerekce, gecerli, aracCagrilari, sureMs, kullanim}}
export async function kararVer({ aday, durum, baglam, gecmis, araclar, piyasaOkx }) {
  const bas = Date.now();
  const aracCagrilari = [];
  const kullanim = { input: 0, output: 0 };
  const kullanici = JSON.stringify({ aday, piyasaDurumu: durum, trDemoBaglam: baglam, sonTezlerim: gecmis }, null, 1);
  const contents = [{ role: "user", parts: [{ text: `Aday ve piyasa durumu:\n${kullanici}\n\nKararını ver.` }] }];
  const sonuc = (ek) => ({ aracCagrilari, sureMs: Date.now() - bas, kullanim, ...ek });

  try {
    for (let tur = 0; tur <= ARAC_BUTCESI + 1; tur++) {
      const kalan = SURE_MS - (Date.now() - bas);
      if (kalan < 2_000) return bekle("zaman aşımı (45 sn)", sonuc());
      const butceBitti = aracCagrilari.length >= ARAC_BUTCESI;

      const res = await ai().models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: SISTEM,
          tools: [{ functionDeclarations: araclar }],
          // Bütçe dolunca araç kapatılır ve cevap JSON şemasına zorlanır
          toolConfig: { functionCallingConfig: { mode: butceBitti ? FunctionCallingConfigMode.NONE : FunctionCallingConfigMode.AUTO } },
          ...(butceBitti ? { responseMimeType: "application/json", responseJsonSchema: KARAR_SEMASI } : {}),
          maxOutputTokens: 4000,
          httpOptions: { timeout: kalan },
        },
      });
      kullanim.input += res.usageMetadata?.promptTokenCount ?? 0;
      kullanim.output += (res.usageMetadata?.candidatesTokenCount ?? 0) + (res.usageMetadata?.thoughtsTokenCount ?? 0);

      const aday0 = res.candidates?.[0];
      if (!aday0?.content) {
        return bekle(`boş cevap (${aday0?.finishReason ?? res.promptFeedback?.blockReason ?? "?"})`, sonuc());
      }
      const cagrilar = res.functionCalls ?? [];
      if (cagrilar.length) {
        contents.push(aday0.content); // modelin turunu değiştirmeden geri gönder (thought signature'lar korunur)
        const yanitlar = [];
        for (const c of cagrilar) {
          if (aracCagrilari.length >= ARAC_BUTCESI || !LLM_ARACLARI.includes(c.name)) {
            yanitlar.push({ functionResponse: { id: c.id, name: c.name, response: { hata: "Araç bütçesi doldu veya araç izinli değil. Şimdi kararını JSON olarak ver." } } });
            continue;
          }
          const t0 = Date.now();
          try {
            const veri = await piyasaOkx.call(c.name, c.args ?? {});
            yanitlar.push({ functionResponse: { id: c.id, name: c.name, response: { sonuc: JSON.stringify(veri).slice(0, 6000) } } });
            aracCagrilari.push({ arac: c.name, girdi: c.args, ms: Date.now() - t0 });
          } catch (e) {
            yanitlar.push({ functionResponse: { id: c.id, name: c.name, response: { hata: e.message.slice(0, 500) } } });
            aracCagrilari.push({ arac: c.name, girdi: c.args, ms: Date.now() - t0, hata: e.message.slice(0, 200) });
          }
        }
        contents.push({ role: "user", parts: yanitlar });
        continue;
      }

      // Son cevap: JSON (gerekirse ```json çitini temizle) + kod tarafı sınırlar
      const metin = (res.text ?? "").trim().replace(/^```(?:json)?\s*|\s*```$/g, "");
      let k;
      try {
        k = JSON.parse(metin);
      } catch {
        if (!butceBitti) {
          // Şemaya zorlanmış son bir istek: araçlar kapalı, responseJsonSchema açık
          contents.push(aday0.content);
          contents.push({ role: "user", parts: [{ text: "Kararını yalnızca istenen JSON nesnesi olarak ver." }] });
          aracCagrilari.push(...Array(Math.max(0, ARAC_BUTCESI - aracCagrilari.length)).fill(null).map(() => ({ arac: "(bütçe kapatıldı)" })));
          continue;
        }
        return bekle("şemaya uymayan cevap", sonuc({ ham: metin.slice(0, 300) }));
      }
      if (!["AL", "BEKLE", "PAS"].includes(k.karar)) return bekle("geçersiz karar", sonuc());
      const boyutCarpani = k.karar === "AL" ? Math.min(1, Math.max(0, Number(k.boyutCarpani) || 0)) : 0;
      return {
        karar: k.karar,
        boyutCarpani,
        guven: Math.min(100, Math.max(0, Math.round(Number(k.guven) || 0))),
        sureDk: Math.min(TEZ_MAX_DK, Math.max(TEZ_MIN_DK, Math.round(Number(k.sureDk) || TEZ_MIN_DK))),
        gerekce: String(k.gerekce ?? "").slice(0, 600),
        gecerli: true,
        model: res.modelVersion ?? MODEL,
        ...sonuc(),
        aracCagrilari: aracCagrilari.filter((a) => a.arac !== "(bütçe kapatıldı)"),
      };
    }
    return bekle("araç döngüsü sonlanmadı", sonuc());
  } catch (e) {
    const tur = e?.name === "AbortError" || /timeout|timed out|aborted/i.test(e?.message ?? "") ? "zaman aşımı" : e?.status ? `API hatası ${e.status}` : "hata";
    return bekle(`${tur}: ${(e?.message ?? String(e)).slice(0, 200)}`, sonuc());
  }
}
