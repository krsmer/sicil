// LLM karar katmanı (K-15): kural motorunun adayını Claude Sonnet 5.5 araştırır ve AL / BEKLE / PAS der.
// - LLM'in araçları, anahtarı OLMAYAN ayrı bir `okx-trade-mcp --profile piyasa --read-only --modules market` sürecinden
//   gelir (K-11): emir aracı yok, hesap anahtarı yok.
// - Sayıları (giriş, stop, hedef, tavan) kural motoru verir; LLM sadece boyutCarpani (0–1, sadece küçültür), güven ve
//   tez süresi (60–120 dk) seçer.
// - En fazla 4 araç çağrısı, toplam en fazla 45 sn. Aşım, şemaya uymayan cevap, ret veya hata → BEKLE.
import Anthropic from "@anthropic-ai/sdk";

export const MODEL = "claude-sonnet-5-5";
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
Araştırma için en fazla ${ARAC_BUTCESI} araç çağrısı yapabilirsin (global OKX türev verisi: funding, açık pozisyon, OI değişimi, piyasa taraması, indikatörler). Gerekmiyorsa hiç araç çağırma.
"guven" tezin tutma olasılığına dair dürüst tahminindir (0-100); geçmiş tezlerinin sonuçlarına göre kalibre et. Aşırı güven Brier skorunla zincirde görünür.
"boyutCarpani" 0 ile 1 arasıdır ve sadece boyutu küçültür. "sureDk" ${TEZ_MIN_DK}-${TEZ_MAX_DK} arasıdır.
Son cevabın yalnızca istenen JSON nesnesi olsun.`;

let _client;
const client = () => (_client ??= new Anthropic({ maxRetries: 0 }));

function bekle(neden, ek = {}) {
  return { karar: "BEKLE", boyutCarpani: 0, guven: 0, sureDk: TEZ_MIN_DK, gerekce: neden, gecerli: false, ...ek };
}

/// MCP araç tanımlarını Claude araç biçimine çevirir (sadece izinli olanlar).
export async function araclariHazirla(piyasaOkx) {
  const { tools } = await piyasaOkx.client.listTools();
  return tools
    .filter((t) => LLM_ARACLARI.includes(t.name) && t.annotations?.readOnlyHint)
    .map((t) => ({ name: t.name, description: (t.description ?? "").slice(0, 1000), input_schema: t.inputSchema }));
}

/// @returns {{karar, boyutCarpani, guven, sureDk, gerekce, gecerli, aracCagrilari, sureMs, kullanim}}
export async function kararVer({ aday, durum, baglam, gecmis, araclar, piyasaOkx }) {
  const bas = Date.now();
  const aracCagrilari = [];
  const kullanim = { input: 0, output: 0 };
  const kullanici = JSON.stringify({ aday, piyasaDurumu: durum, trDemoBaglam: baglam, sonTezlerim: gecmis }, null, 1);
  const messages = [{ role: "user", content: `Aday ve piyasa durumu:\n${kullanici}\n\nKararını ver.` }];

  try {
    for (let tur = 0; tur <= ARAC_BUTCESI; tur++) {
      const kalan = SURE_MS - (Date.now() - bas);
      if (kalan < 2_000) return bekle("zaman aşımı (45 sn)", { aracCagrilari, sureMs: Date.now() - bas, kullanim });
      const butceBitti = aracCagrilari.length >= ARAC_BUTCESI;

      const res = await client().beta.messages.create(
        {
          model: MODEL,
          max_tokens: 4000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          system: SISTEM,
          thinking: { type: "adaptive" },
          output_config: { effort: "medium", format: { type: "json_schema", schema: KARAR_SEMASI } },
          tools: araclar,
          tool_choice: butceBitti ? { type: "none" } : { type: "auto" },
          messages,
        },
        { timeout: kalan },
      );
      kullanim.input += res.usage?.input_tokens ?? 0;
      kullanim.output += res.usage?.output_tokens ?? 0;

      if (res.stop_reason === "refusal") {
        return bekle(`model reddetti (${res.stop_details?.category ?? "?"})`, { aracCagrilari, sureMs: Date.now() - bas, kullanim });
      }
      if (res.stop_reason === "tool_use") {
        messages.push({ role: "assistant", content: res.content }); // değiştirmeden geri gönder (preserved thinking)
        const sonuclar = [];
        for (const b of res.content.filter((x) => x.type === "tool_use")) {
          if (aracCagrilari.length >= ARAC_BUTCESI || !LLM_ARACLARI.includes(b.name)) {
            sonuclar.push({ type: "tool_result", tool_use_id: b.id, is_error: true, content: "Araç bütçesi doldu veya araç izinli değil. Şimdi kararını JSON olarak ver." });
            continue;
          }
          const t0 = Date.now();
          try {
            const veri = await piyasaOkx.call(b.name, b.input);
            const metin = JSON.stringify(veri);
            sonuclar.push({ type: "tool_result", tool_use_id: b.id, content: metin.slice(0, 6000) });
            aracCagrilari.push({ arac: b.name, girdi: b.input, ms: Date.now() - t0 });
          } catch (e) {
            sonuclar.push({ type: "tool_result", tool_use_id: b.id, is_error: true, content: e.message.slice(0, 500) });
            aracCagrilari.push({ arac: b.name, girdi: b.input, ms: Date.now() - t0, hata: e.message.slice(0, 200) });
          }
        }
        messages.push({ role: "user", content: sonuclar });
        continue;
      }

      // Son cevap: JSON şeması + kod tarafı sınırlar
      const metin = res.content.filter((b) => b.type === "text").map((b) => b.text).join("");
      let k;
      try {
        k = JSON.parse(metin);
      } catch {
        return bekle("şemaya uymayan cevap", { aracCagrilari, sureMs: Date.now() - bas, kullanim, ham: metin.slice(0, 300) });
      }
      if (!["AL", "BEKLE", "PAS"].includes(k.karar)) return bekle("geçersiz karar", { aracCagrilari, sureMs: Date.now() - bas, kullanim });
      const boyutCarpani = k.karar === "AL" ? Math.min(1, Math.max(0, Number(k.boyutCarpani) || 0)) : 0;
      return {
        karar: k.karar,
        boyutCarpani,
        guven: Math.min(100, Math.max(0, Math.round(Number(k.guven) || 0))),
        sureDk: Math.min(TEZ_MAX_DK, Math.max(TEZ_MIN_DK, Math.round(Number(k.sureDk) || TEZ_MIN_DK))),
        gerekce: String(k.gerekce ?? "").slice(0, 600),
        gecerli: true,
        model: res.model,
        aracCagrilari,
        sureMs: Date.now() - bas,
        kullanim,
      };
    }
    return bekle("araç döngüsü sonlanmadı", { aracCagrilari, sureMs: Date.now() - bas, kullanim });
  } catch (e) {
    const tur = e instanceof Anthropic.APIConnectionTimeoutError ? "zaman aşımı" : e instanceof Anthropic.APIError ? `API hatası ${e.status ?? ""}` : "hata";
    return bekle(`${tur}: ${e.message.slice(0, 200)}`, { aracCagrilari, sureMs: Date.now() - bas, kullanim });
  }
}
