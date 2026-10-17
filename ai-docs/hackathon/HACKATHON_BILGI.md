# Agentic Hackathon (Ankara) – Bilgi Dosyası

> Kaynak: https://agentichackathon.team1.network/tr (+ /en, /tr/submission, /tr/nft-mint), OKX ATK dokümanları ve GitHub reposu. Tarama tarihi: 15 Ekim 2026.
> Not: Hackathon sitesi ATK için teknik doküman linki vermiyor; teknik bölümler OKX'in resmi kaynaklarından derlendi.

## 1. Özet

| | |
|---|---|
| Etkinlik | Agentic Hackathon, OKX TR × Team1 Türkiye, ekosistem ortağı Avalanche |
| Tarih / yer | **17 Ekim 2026 (Cumartesi)**, THK Orion Tekmer, Söğütözü, Ankara (tam adres kabul e-postasında) |
| Format | Tek gün, 50 seçilmiş katılımcı, ücretsiz (workshop + yemek dahil; şehir dışına yol desteği planlanıyor) |
| Başvuru | Kapandı; seçilenlere e-posta ile dönüş |
| Proje teslim | Etkinlik günü **19:00** |
| Ödüller | 1.: $1.500 · 2.: $1.000 · 3.: $500 |
| Track | Ayrı track yok: 1 zorunlu görev + 2 opsiyonel bonus |
| Takım büyüklüğü | Sitede belirtilmemiş |
| Blockchain deneyimi | Ana görev için gerekmiyor |

## 2. Görev

- **Ana görev (zorunlu):** OKX **Agent Trade Kit (ATK)** ile çalışan, otonom bir AI agent geliştirmek.
- **Bonus 1 (opsiyonel):** Agent'ı bir **trading agent'a** dönüştürüp ATK ile **gerçek piyasa koşullarında** test etmek.
- **Bonus 2 (opsiyonel):** Agent'ı/ürünü **Avalanche** üzerinde deploy etmek.
- Bonuslar ekstra puan getirir.

## 3. Değerlendirme kriterleri

| Kriter | Ağırlık |
|---|---|
| Agent mimarisi ve otonomi | **%35** |
| Ürün ve strateji | %25 |
| Teknik kalite | %20 |
| Demo ve sunum | %20 |
| Bonus görevler | + ekstra puan |

Finalde 10 proje, her biri **10 dakika** sunum yapar.
Çıkarım (sitede yazmıyor): En büyük ağırlık otonomiye verildiği için agent'ın insan müdahalesi olmadan karar alıp (analiz, sinyal, risk yönetimi) aksiyon alan bir döngüye sahip olması öne çıkmalı.

## 4. Program (17 Ekim)

| Saat | Etkinlik |
|---|---|
| 08:00 | Kayıt |
| 09:00 | Açılış (OKX TR & Team1 Türkiye) |
| 09:30 | OKX ATK × Avalanche workshop |
| 10:00 | Hackathon başlar |
| 13:00 | Mentorluk oturumları |
| 19:00 | Proje teslimi, jüri değerlendirmesi, akşam yemeği |
| 20:00 | Final sunumları (10 finalist × 10 dk) |
| 21:45 | Ödül töreni ve kapanış |

Toplam geliştirme süresi: **~9 saat (10:00–19:00)**.

## 5. Jüri ve konuşmacılar

- **Jüri:** Ahmet Ramazan Ağırtaş (Ayware), Hüseyin Berk Vardarbaşı (OKX TR), Burak Yüksel (OKX TR), İbrahim Okan Sarıırmak (Clarion Labs), Ömer Aksu (Team1 Türkiye), Ulaş Yıldız (Team1 Türkiye)
- **Konuşmacılar:** Hürsel Çay (Team1 Türkiye), Ufuk Agus (OKX TR), Gülen Tokay (THK & Orion Tekmer), Ömer Aksu (Team1 Türkiye), Toygun Tez (OKX TR / Team1 Türkiye)

## 6. OKX Agent Trade Kit (ATK) – Teknik Rehber

### 6.1 Nedir
- AI asistanlarını OKX hesabına bağlayan **yerel (local, stdio)** bir araç seti. MIT lisanslı, açık kaynak. API anahtarları makinede kalır, imzalama yereldir.
- Üç arayüz: **MCP Server** (`okx-trade-mcp`), **CLI** (`okx`), **Skills** (agent'lar için SKILL.md dosyaları).
- Gereksinim: **Node.js ≥ 18**.

### 6.2 Kurulum
```bash
npm install -g @okx_ai/okx-trade-mcp @okx_ai/okx-trade-cli
okx market ticker BTC-USDT     # doğrulama; market verisi API key gerektirmez
okx config init                # interaktif sihirbaz -> ~/.okx/config.toml
okx-trade-mcp setup --client claude-code   # claude-desktop | cursor | vscode | windsurf | claude-code
```
Skills: `npx skills add okx/agent-skills`

### 6.3 config.toml (`~/.okx/config.toml`)
```toml
default_profile = "demo"

[profiles.demo]
api_key    = "..."
secret_key = "..."
passphrase = "..."
demo       = true          # simüle işlem, gerçek para yok

[profiles.live]
site       = "tr"          # global | eea | us | tr  -> OKX TR hesabı için "tr" (https://tr.okx.com)
api_key    = "..."
secret_key = "..."
passphrase = "..."
```
- Alanlar: `api_key`, `secret_key`, `passphrase`, `demo`, `site`, `proxy_url` (yalnızca HTTP/HTTPS), `base_url` (site eşlemesini ezer).
- Site önceliği: `--site` flag → `OKX_SITE` env → toml `site` → OAuth login sitesi → `global`. Diğer env: `OKX_API_BASE_URL`.
- **OKX TR kullanıcıları `site = "tr"` ayarlamalı** (API base: https://tr.okx.com).
- Passphrase'te `# \ " '` gibi karakterler varsa tırnaklamaya dikkat (parse hatası verir).

### 6.4 API key
- Oluşturma: https://www.okx.com/account/my-api (TR hesabı için tr.okx.com üzerinden).
- **Demo key'ler ayrıdır:** OKX → Demo Trading → API Management.
- Yetkiler: `market` → key gerekmez; okuma → **Read**; emir verme → **Read + Trade**. **Withdraw verme.** Mümkünse sub-account ve IP kısıtı kullan.
- "Smart registration": key'in trade yetkisi yoksa emir araçları agent'tan gizlenir.

### 6.5 MCP sunucusu başlatma
```bash
okx-trade-mcp --modules market                     # sadece piyasa verisi, key yok
okx-trade-mcp --profile demo --modules all         # demo, tüm modüller
okx-trade-mcp --profile live --read-only           # canlı, sadece okuma
okx-trade-mcp --profile live --modules market,spot # canlı, sadece spot
```
Flag'ler: `--profile`, `--modules`, `--site`, `--read-only`, `--no-log` (audit log `~/.okx/logs/`), `--log-level`.
Varsayılan modüller: `spot, swap, account`.

**Claude Code:**
```bash
claude mcp add --transport stdio okx-trade-mcp -- okx-trade-mcp --profile demo --modules all
```
veya proje kökünde `.mcp.json`:
```json
{ "mcpServers": { "okx-trade-mcp": { "type": "stdio", "command": "okx-trade-mcp", "args": ["--profile","demo","--modules","all"] } } }
```
**Claude Desktop / Cursor:** `"command": "npx", "args": ["-y","@okx_ai/okx-trade-mcp","--profile","demo","--modules","market,account,spot,swap"]`
⚠️ Cursor sunucu başına ~40, toplam ~80 araç sınırı koyar; `--modules all` (128 araç) Cursor'da hata verir.

### 6.6 Modüller ve önemli araçlar
| Modül | Kapsam / örnek araçlar |
|---|---|
| `market` (key yok) | `market_get_ticker`, `market_get_orderbook`, `market_get_candles` (≤300 bar), `market_get_history_candles`, `market_get_funding_rate`, `market_get_open_interest`, `market_get_trades`, `market_get_instruments`, 70+ teknik indikatör |
| `spot` | `spot_place_order`, `spot_cancel_order`, `spot_amend_order`, `spot_batch_place_orders` (≤20), OCO/koşullu emirler, geçmiş/fills |
| `swap` (perpetual) | `swap_place_order`, `swap_close_position`, `swap_get_positions`, `swap_set_leverage`, algo (koşullu/OCO/trailing stop) |
| `futures` | Vadeli kontrat emir/pozisyon araçları |
| `option` | Emirler, `option_get_greeks` (IV, delta, gamma...), option chain |
| `account` | `account_get_balance`, `account_get_positions`, `account_get_bills`, `account_get_trade_fee`, `account_get_max_size` · araç çağrısı kaydı: `trade_get_history` (`account_get_fee_rates` ve `account_get_audit_log` adları v1.4.8'de yok) |
| `bot` (`bot.grid`, `bot.dca`) | `grid_create_order`, `grid_stop_order`, `dca_create_order`... (grid botun demo'da çalışıp çalışmadığı doğrulanmadı; resmi skill demo örneği veriyor) |
| `earn`, `event`, `news`, `smartmoney` | Earn ürünleri, event kontratları, haber/sentiment, trader leaderboard/sinyaller (read-only) |

- Para hareket ettiren araçlar `[CAUTION]` etiketlidir. Dahili rate limiter var.
- Yeteneği kontrol: `system_get_capabilities`.
- Enstrüman ID örnekleri: `BTC-USDT` (spot), `BTC-USDT-SWAP` (perpetual), `BTC-USD-250328` (futures).

### 6.7 CLI (scripting için ideal; `--json` çıktısı)
```bash
okx market candles BTC-USDT --bar 1H --limit 200 --json | python3 analyze.py
okx spot place --instId BTC-USDT --side buy --ordType market --sz 100
okx swap place --instId BTC-USDT-SWAP --side buy --ordType market --sz 1 --posSide long --tdMode cross
okx account balance --json
okx --demo bot grid create --instId BTC-USDT --algoOrdType grid --maxPx 100000 --minPx 80000 --gridNum 10 --quoteSz 100
```
- CLI alt komutları boşlukla (`okx swap algo place`), MCP araçları alt çizgiyle (`swap_place_algo_order`); birbirine çevirme.
- CLI hata durumunda exit code 1 ve stderr'e TraceId basar. MCP hataları `code, message, suggestion, endpoint, traceId` içeren JSON döner.

### 6.8 Skills
`okx-cex-market` (public), `okx-cex-trade`, `okx-cex-portfolio`, `okx-cex-bot`, `okx-cex-earn`, `okx-cex-smartmoney` (API key gerekir). Repo: https://github.com/okx/agent-skills

### 6.9 Kısıtlar
- Desteklenmeyen: Asset (para yatırma/çekme/transfer), Convert, Sub-account yönetimi, Copy/Spread/Block trading, Recurring Buy.
- Şu an yalnızca yerel çalışır (bulut hosting "yakında").
- Kendi agent'ından (MCP client olmadan) kullanmak için pratik yol: CLI'ı `--json` ile alt süreç olarak çağırmak, ya da MCP sunucusuna bir MCP client SDK ile stdio üzerinden bağlanmak (çıkarım; dokümanda örneği yok).

## 7. Avalanche (Bonus 2)

Sitede deploy için teknik detay yok; aşağıdakiler genel Avalanche bilgisidir (resmi sitelerden doğrulanmalı):
- C-Chain EVM uyumlu (Solidity, Hardhat/Foundry çalışır).
- **Fuji testnet:** chainId 43113, RPC `https://api.avax-test.network/ext/bc/C/rpc`, explorer https://testnet.snowtrace.io, faucet https://core.app/tools/testnet-faucet
- **Mainnet C-Chain:** chainId 43114, RPC `https://api.avax.network/ext/bc/C/rpc`, explorer https://snowtrace.io
- Dokümanlar: https://build.avax.network/docs

## 8. Hatıra NFT'si (soulbound)

- Sayfa: https://agentichackathon.team1.network/tr/nft-mint
- Ağ: Avalanche C-Chain, kontrat `0x38f27871C2feddb06759E392fba317CDfe511149` (https://snowtrace.io/address/0x38f27871C2feddb06759E392fba317CDfe511149)
- 100 adet, ücretsiz (sadece AVAX gas), cüzdan başı 1, devredilemez (ERC-5192). Smart wallet ve agent'lar da mint edebilir. Tarama anında mint henüz açılmamıştı (0/100).

## 9. Linkler

**Hackathon**
- Ana sayfa: https://agentichackathon.team1.network/tr · EN: https://agentichackathon.team1.network/en
- Başvuru/teslim: https://agentichackathon.team1.network/tr/submission (form kaldırılmış)
- NFT: https://agentichackathon.team1.network/tr/nft-mint
- Team1 Türkiye: https://turkiye.team1.network/ · Telegram: https://t.me/team1turkiye · X: https://x.com/Team1TUR · Instagram: https://www.instagram.com/team1tur/

**OKX ATK**
- Repo: https://github.com/okx/agent-trade-kit
- Resmi doküman: https://www.okx.com/docs-v5/agent_en/
- Ürün sayfası: https://www.okx.com/en-us/agent-tradekit
- Konfigürasyon: https://github.com/okx/agent-trade-kit/blob/github-main/docs/configuration.md
- CLI referansı: https://github.com/okx/agent-trade-kit/blob/github-main/docs/cli-reference.md
- FAQ: https://github.com/okx/agent-trade-kit/blob/github-main/docs/faq.md
- Skills: https://github.com/okx/agent-skills
- DeepWiki: https://deepwiki.com/okx/agent-trade-kit
- OKX v5 API: https://www.okx.com/docs-v5/en/
- ATK Telegram: https://t.me/OKX_AgentKit

## 10. Sitede olmayan / belirsiz noktalar
- Takım büyüklüğü, teslim formatı (GitHub repo, demo video vb.) ve kodun önceden yazılıp yazılamayacağı belirtilmemiş. Kabul e-postasında veya açılışta sorulmalı.
- Bonus 1'deki "gerçek piyasa" ifadesi canlı hesapla mı yoksa demo ile mi yapılacak, belirsiz.

## 11. Hazırlık önerileri (çıkarım)
1. Etkinlikten önce Node 18+, ATK kurulumu ve `okx market ticker BTC-USDT` testini yap.
2. OKX TR hesabında demo ve (bonus için) küçük bakiyeli live API key hazırla; `site = "tr"` ayarla, Withdraw yetkisi verme.
3. Agent iskeletini (LLM + ATK MCP/CLI + karar döngüsü + risk limitleri + log) hazır tut; 9 saatte strateji ve demoya odaklan.
4. Otonomi %35: agent'ın gözlem → analiz → karar → emir → izleme döngüsünü ve risk kurallarını sunumda net göster.
5. Bonus 2 için Fuji testnet'e basit bir kontrat (ör. agent karar/işlem kaydı) deploy etmeye hazır ol.
