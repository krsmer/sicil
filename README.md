# SİCİL: uydurulamayan işlem sicili

OKX TR spotta işlem yapan otonom bir yapay zekâ ajanı her kararını Avalanche'a işlemden önce mühürler; bağımsız bir denetçi ajan hesabın bütün işlemlerini mühürlerle karşılaştırır. Agentic Hackathon (OKX TR × Team1 Türkiye, Ankara, 17 Ekim 2026) projesi.

**Önce oku:** [`memory-bank/`](memory-bank/README.md). Proje özeti, ürün, mimari, teknoloji, aktif görevler, ilerleme, sunum ve kararlar orada.

## Başlangıç kiti

Bu klasör projenin repo kökü olacak şekilde hazırlandı. VS Code'da bu klasörü aç ve Claude Code (veya Cursor) ile çalışmaya başla. Yapay zekâya ayrıca dosya yüklemene gerek yok.

## Yapı
```
sicil/
├── AGENTS.md        ← AI'nın ana talimatı (Cursor/Codex/Copilot bunu okur)
├── CLAUDE.md        ← Claude Code bunu okur, o da AGENTS.md'yi yükler
├── .mcp.json        ← Avalanche docs MCP + OKX demo/market MCP bağlantıları
├── .gitignore       ← .env, log ve build çıktıları repoya girmez
├── README.md        ← bu dosya
├── memory-bank/     ← PROJENİN HAFIZASI: brief, ürün, mimari, teknoloji, aktif görevler, ilerleme, sunum, kararlar
└── ai-docs/
    ├── docs/        ← AI için kısa rehberler (01 ATK, 02 entegrasyon, 03 Avalanche, 04 canlı erişim, 05 hackathon)
    ├── sources/     ← resmi dokümanların kopyaları + 168 ATK aracının kataloğu
    ├── hackathon/   ← HACKATHON_BILGI.md ve ODULLU_PROJELER.md
    ├── templates/   ← AgentDecisionLog.sol, agent-skeleton.mjs, foundry.toml, okx config örneği
    └── scripts/     ← kaynakları yenileme
```
Tüm yollar repo köküne göre yazıldı; klasörü olduğu gibi kopyalarsan linkler çalışır.

## Kopyaladıktan sonra
1. `npm install -g @okx_ai/okx-trade-mcp @okx_ai/okx-trade-cli`, sonra `okx market ticker BTC-USDT`.
2. `okx config init` ile `~/.okx/config.toml` oluştur (örnek: `ai-docs/templates/okx-config.example.toml`). OKX TR demo key, `site = "tr"`, `demo = true`. Yetki Read + Trade, Withdraw asla. Key'ler repoya girmez.
3. VS Code'da klasörü aç, Claude Code'u başlat. `.mcp.json` içindeki sunucuları onaylaması istenecek; onayla. `/mcp` ile bağlı olduklarını kontrol edebilirsin.
4. **TR testi:** ATK, TR sitesinde demo trading'i "henüz test edilmedi" olarak işaretliyor; `news` modülü için de sadece Global destek yazıyor. Bir demo emir ve bir `okx news` komutu dene; çalışmazsa global demo hesabını yedek profil ekle.
5. Fuji: SİCİL'in 4 cüzdanı (sahip, trader, denetçi, fren) şifreli keystore olarak `~/.foundry/keystores/` altında hazır ve fonlu (bkz. `memory-bank/techContext.md`). Projenin kontratı `SicilKasasi` (bkz. `memory-bank/systemPatterns.md`); `ai-docs/templates/AgentDecisionLog.sol` sadece referans şablon.
6. Git: **bu gece commit atma.** Hackathon'da "ilk commit gün içinde" kuralı olabilir; repoyu yarın 10:00'da `git init` ile aç ve ilk commit'i orada at.

## Yapay zekâyla akış
- **Fikir ve mimari:** "AGENTS.md'yi ve ai-docs/docs/05'i oku, şu fikir için mimari öner" de. Önerdiği her ATK aracını `ai-docs/sources/okx-atk/TOOL_CATALOG.md` içinde arattır.
- **Fikir netleşti (SİCİL):** AGENTS.md'nin "Project-specific notes" kısmı ve `memory-bank/` dolduruldu. Kod çalışır hale gelince çalıştırma komutunu AGENTS.md'ye ekle.
- **Her görevden sonra:** yapay zekâdan `memory-bank/activeContext.md` ve `memory-bank/progress.md` dosyalarını güncellemesini iste.
- **Kodlama:** AI emin olmadığında dosyalara ya da canlı MCP'ye bakmak zorunda; bu AGENTS.md'de kural olarak yazılı.
