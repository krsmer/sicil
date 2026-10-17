# Memory Bank: SİCİL

Bu klasör projenin hafızası. Yapay zekâ (Claude Code, Cursor, Codex) her oturumun başında bu dosyaları okur; böylece bağlamdan kopmaz ve aynı kararları yeniden tartışmaz.

## Okuma sırası

| Sıra | Dosya | Ne anlatır | Ne sıklıkla değişir |
|---|---|---|---|
| 1 | [projectBrief.md](projectBrief.md) | Projenin özü: ne yapıyoruz, hackathon kuralları, kapsam, değişmez kurallar | Neredeyse hiç |
| 2 | [productContext.md](productContext.md) | Ürün: hangi sorunu çözüyor, kimin için, nasıl farklılaşıyor | Nadiren |
| 3 | [systemPatterns.md](systemPatterns.md) | Mimari, veri akışı, kontrat tasarımı, karar döngüsü, hata davranışları | Tasarım değişince |
| 4 | [techContext.md](techContext.md) | Teknoloji yığını, sürümler, kurulumlar, ATK araç adları, bilinen tuzaklar | Kurulum/sürüm değişince |
| 5 | [activeContext.md](activeContext.md) | Şu an ne üzerinde çalışılıyor, açık kararlar, sıradaki adımlar | **Her görevden sonra** |
| 6 | [progress.md](progress.md) | Ne bitti, ne kaldı, saat planı ve karar kapıları, doğrulama kaydı | **Her görevden sonra** |
| 7 | [demoScript.md](demoScript.md) | 10 dakikalık sunum, ilk 60 saniye metni, jüri soruları ve cevapları | Sunum hazırlanırken |
| 8 | [decisionLog.md](decisionLog.md) | Alınmış kararlar ve gerekçeleri, araştırma özeti (neden SİCİL) | Yeni karar alınınca |

Diyagramlar: [assets/mimari.png](assets/mimari.png) (sistem mimarisi), [assets/saat-plani.png](assets/saat-plani.png) (17 Ekim saat planı).

## Yapay zekâ için güncelleme kuralları

1. **Oturum başında** 1–6 arası dosyaları oku. Sunum işi yapıyorsan 7'yi, "neden böyle karar verdik" sorusu varsa 8'i de oku.
2. **Bir görevi bitirince** `activeContext.md` (ne yapıldı, sırada ne var) ve `progress.md` (kutucuklar, doğrulama kaydı) dosyalarını güncelle. Saat ve tarih yaz.
3. **Mimari veya kontrat değişirse** `systemPatterns.md` dosyasını güncelle ve `decisionLog.md` dosyasına gerekçesiyle bir kayıt ekle.
4. **Yeni kütüphane, sürüm veya araç** eklenirse `techContext.md` dosyasını güncelle.
5. `decisionLog.md` dosyasındaki kararları **tartışmaya yeniden açma**. Bir kararın değişmesi gerekiyorsa insana sor, onay gelirse yeni bir kayıt ekle (eskisini silme).
6. Emin olmadığın bir ATK araç adı, parametre veya zincir bilgisini **uydurma**: `techContext.md` → `ai-docs/sources/okx-atk/TOOL_CATALOG.md` → canlı MCP sırasıyla kontrol et.
7. Bu dosyalara **asla** API anahtarı, özel anahtar, keystore şifresi veya passphrase yazma. Cüzdan **adresleri** (0x…) yazılabilir, gizli değildir.
