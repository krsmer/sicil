# Tech Context: SİCİL

> Sürümler ve kurulumlar 16 Ekim 2026 akşamı Arif'in makinesinde (macOS, Apple Silicon) kuruldu ve test edildi. Diğer ekip üyeleri aynı sürümleri kurmalı.

## 1. Kurulu araçlar

| Araç | Sürüm | Konum | Kontrol komutu |
|---|---|---|---|
| Node.js | v22.22.0 (npm 10.9.4) | Homebrew | `node --version` · **17 Ekim taramasında PATH'teki `node` v25.6.1 çıktı** (`/opt/homebrew/bin/node`); v22 `/opt/homebrew/opt/node@22/bin` altında. Proje hangisiyle çalışacak, netleştir |
| OKX ATK MCP sunucusu | `@okx_ai/okx-trade-mcp@1.4.8` | `/opt/homebrew/bin/okx-trade-mcp` | — |
| OKX ATK CLI | `@okx_ai/okx-trade-cli@1.4.8` | `/opt/homebrew/bin/okx` | `okx --version` → `1.4.8` |
| Foundry (forge, cast, anvil, chisel) | 1.8.5 | `~/.foundry/bin` (PATH: `~/.zshenv`) | `forge --version` |
| Solidity derleyici | 0.8.24 (`foundry.toml` şablonu) | Foundry indirir | `forge build` |
| viem | 2.57.7 (`agents/package.json`, ESM) | `agents/node_modules` | `node agents/shared/commit.mjs …` |
| @modelcontextprotocol/sdk | 1.32.1 | `agents/node_modules` | ATK MCP istemcisi (`agents/shared/okx.mjs`) |
| @google/genai | 2.30.0 | `agents/node_modules` | LLM karar katmanı (`agents/trader/karar.mjs`, **`gemini-3.8-flash`**, K-16); `.env` → `GEMINI_API_KEY` |
| Foundry ayarları | `contracts/foundry.toml`: şablon + `via_ir = true` (stack too deep) + `ffi = true` (viem hash testi); forge-std v1.17.0 submodule | | `cd contracts && forge test` |

Kurulum (diğer ekip üyeleri için):
```bash
npm install -g @okx_ai/okx-trade-mcp@1.4.8 @okx_ai/okx-trade-cli@1.4.8
curl -L https://foundry.paradigm.xyz | bash && foundryup
```
Not: ATK'nin npm kurulumu `~/.okx/bin/` altına OKX'in kendi yardımcı binary'lerini (`okx-auth`, `okx-pilot`) SHA-256 doğrulamasıyla indirir; bu normal.

## 2. Önerilen yığın [öneri: ekip onaylamadı]

| Katman | Öneri | Neden |
|---|---|---|
| Dil | TypeScript (Node 22, ESM) | ATK, MCP SDK ve viem aynı ekosistemde |
| ATK erişimi | `@modelcontextprotocol/sdk` ile stdio MCP istemcisi (`ai-docs/templates/agent-skeleton.mjs`) | Araç listesi + `readOnlyHint` ile yazma araçlarını ayırmak kolay |
| Zincir | `viem` (`avalancheFuji` zinciri) | Olay dinleme, imza, `encodeAbiParameters` + `keccak256` |
| Kontrat | Foundry (Solidity 0.8.24, `evm_version = "cancun"`) | Test + deploy + verify tek araçta |
| LLM | Karar ekipte. Claude için güncel model kimlikleri: `claude-sonnet-5-5` (hızlı), `claude-opus-5-5` (en güçlü). API ayrıntılarını ezberden değil, güncel dokümandan al | Tool use ile ATK okuma araçlarını doğrudan çağırabilir |
| Panel | Tek sayfa (Vite + React veya düz HTML/JS), viem ile olay okuma | Hızlı, sunucu gerektirmez |
| Log | JSONL (`decisions.jsonl`, `.gitignore`'da) + `reports/*.json` (repoda, hash'leri zincirde) | Denetçi raporları herkese açık olmalı |

## 3. Avalanche Fuji

| | |
|---|---|
| chainId | **43113** |
| RPC | `https://api.avax-test.network/ext/bc/C/rpc` (16 Ekim'de test edildi, `cast chain-id` → 43113) |
| WebSocket | `wss://api.avax-test.network/ext/bc/C/ws` |
| Explorer | https://testnet.snowtrace.io |
| Gas fiyatı (16 Ekim akşamı ölçüldü) | ~160 wei, base fee ~10 wei: işlem maliyeti pratikte sıfır |
| EVM sürümü | **cancun** (C-Chain Pectra'yı desteklemez; solc ≥ 0.8.30 varsayılan olarak Pectra'ya derler) |
| Verify | 17 Ekim'de ikisi de çalıştı (`contracts/` içinden): **Builder Hub** `forge verify-contract --chain-id 43113 --verifier sourcify --verifier-url https://build.avax.network/api/verify/sourcify <ADR> src/X.sol:X` · **Snowtrace** `forge verify-contract --chain-id 43113 --verifier etherscan --verifier-url https://api.routescan.io/v2/network/testnet/evm/43113/etherscan --etherscan-api-key verifyContract --watch <ADR> src/X.sol:X` |
| Deploy | `forge create src/X.sol:X --rpc-url fuji --account sicil-sahip --password-file ~/.foundry/keystores/.sifreler/sicil-sahip.txt --broadcast` (~4 sn) |

### Cüzdanlar (şifreli Foundry keystore)

| Rol | Hesap adı | Adres | Bakiye (16 Ekim) |
|---|---|---|---|
| Sahip | `sicil-sahip` | `0x8394359d719ccD2cf037Edde7c50011D3cB690A8` | 0,19 AVAX |
| Trader | `sicil-trader` | `0x7c9931802977377aa62315DaebE1D455a2874E07` | 0,15 AVAX |
| Denetçi | `sicil-denetci` | `0x963261691606dCe9C4C9Bd0a5181371BB4eE3D02` | 0,10 AVAX |
| Fren (eski, kullanılmıyor) | `sicil-fren` | `0x9F37AaAeA7a216C2d6fB790707841B39086FCFE3` | 0,05 AVAX |
| **Fren (K-14)** | Core tarayıcı eklentisi | `0xFD056f1A62c5316767Ec0ee36874bAeE1271c35e` | ~0,01 AVAX |

- Keystore'lar: `~/.foundry/keystores/<hesap>`; şifreler: `~/.foundry/keystores/.sifreler/<hesap>.txt` (izinler 600). **Bunlar repoya asla girmez.** Keystore'lar sadece Arif'in makinesinde; deploy ve ajanlar orada çalışır.
- Şifreler otomasyon için keystore'ların yanında düz metin duruyor; bu yüzden şifrelemenin pratik koruması zayıf. **Bu cüzdanlar sadece test içindir; gerçek AVAX asla konmaz.**
- Kullanım:
  ```bash
  cast send <ADRES> "pause()" --account sicil-fren \
    --password-file ~/.foundry/keystores/.sifreler/sicil-fren.txt \
    --rpc-url https://api.avax-test.network/ext/bc/C/rpc
  ```
- Node kodunda özel anahtara ihtiyaç olursa keystore'u şifreyle çözüp **bellekte** tutun; `.env`'e düz anahtar yazmak zorunda kalınırsa `.env` gitignore'da.

### SİCİL kontratları (Fuji)

| Kontrat | Adres | Deploy tx | Doğrulama |
|---|---|---|---|
| **SicilKasasi** | `0x60735035CC6f4d810f4878f9A4a1993F534fe6a8` | `0x75eeb4ca34f9e39153e4af4c17222fce75255cad96fe12ac3bb31845a3e75b0c` | Builder Hub `exact_match`, Snowtrace verified (17 Ekim ~13:25) |
| SicilPing (atılabilir test) | `0xDf769dE9Fc427863C8CC4cf7231226a93c2435f6` | `0x4ad1bd17…6a09` | Builder Hub `exact_match` |

SicilKasasi constructor: sahip `0x8394…90A8`, trader `0x7c99…4E07`, denetçi `0x9632…3D02`, fren `0xFD056f1A62c5316767Ec0ee36874bAeE1271c35e` (Core eklentisi, K-14), `["BTC-USDT","ETH-USDT"]`, `2000, 300, 5000, 10800`. Snowtrace doğrulaması constructor argümanlarını ister: `cast abi-encode "constructor(address,address,address,address,string[],uint256,uint256,uint256,uint256)" …`.

### ERC-8004 resmi kayıtları (Fuji)

16 Ekim'de RPC ile doğrulandı: üçü de ERC-1967 proxy, arkalarında çalışan implementasyon kontratları var.

| Kayıt | Proxy | İmplementasyon (16 Ekim) |
|---|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `0x7274e874ca62410a93bd8bf61c69d8045e399c02` |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | `0x16e0fa7f7c56b9a767e34b192b51f921be31da34` |
| Validation | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` | `0xdb31f5d9167f8ebc8b30fbbf814c4d297c2d7f99` |

**SİCİL agentId'leri (17 Ekim ~12:35, K-12):**

| Ajan | agentId | Sahip (`ownerOf`) | Kayıt tx | agentURI |
|---|---|---|---|---|
| SİCİL Trader | **258** | sahip `0x8394…90A8` | `0xdcd083ac031dc89a3176adb6b591b4872d74aa877b1be57913846753fb3448bd` | `data:application/json;base64,…` ← `agents/registration/trader.json` (`tradingWallet` = trader `0x7c99…4E07`) |
| SİCİL Denetçi | **259** | denetçi `0x9632…3D02` | `0x2b31497a68af79ba588b92c8208fc6c5ccc0f5da53f1f82d8b0d6d43fa160575` | `data:application/json;base64,…` ← `agents/registration/denetci.json` |

Kontroller: `isAuthorizedOrOwner(denetçi, 258) = false` (denetçi trader'a not verebilir), `isApprovedForAll(sahip, denetçi) = false`, `isAuthorizedOrOwner(sahip, 258) = true`, `getAgentWallet(258) = sahip` (beklenen; `setAgentWallet` yapılmadı), `balanceOf(sahip) = 1`.
agentURI biçimi: ERC-8004 registration-v1 (`type`, `name`, `description`, `services`, `active`, `x402Support`, `supportedTrust`) + bizim alanlarımız `tradingWallet`, `owner`, `auditor`. `agentWallet` dosyada yok; zincirde tutulan değer.

**17 Ekim'de doğrulandı** (implementasyonlar 16 Ekim'le aynı, Routescan'de verified, solc 0.8.24, `getVersion()` = `"2.0.0"`). ABI'ler: `agents/shared/abi/erc8004-{identity,reputation,validation}.json`.

| Kayıt | Fonksiyon | Kural (kaynak koddan) |
|---|---|---|
| Identity | `register(string agentURI) → uint256 agentId` (ayrıca `register()` ve `register(string, MetadataEntry[])`) | Çağıran **sahip** olur (ERC-721 mint) ve `agentWallet` metadata'sı otomatik `msg.sender` olur. Olay: `Registered(agentId indexed, agentURI, owner indexed)` |
| Identity | `isAuthorizedOrOwner(spender, agentId)`, `ownerOf`, `balanceOf`, `getAgentWallet` | Panel için okuma |
| Reputation | `giveFeedback(uint256 agentId, int128 value, uint8 valueDecimals, string tag1, string tag2, string endpoint, string feedbackURI, bytes32 feedbackHash)` | **`require(!isAuthorizedOrOwner(msg.sender, agentId), "Self-feedback not allowed")`**: ajanın sahibi ve onaylı operatörü not veremez → denetçi cüzdanı trader agentId'sinin sahibi/onaylısı **olmamalı**. `value` **int128, negatif olabilir** (eksi getiri yazılabilir), `valueDecimals ≤ 18`, \|value\| ≤ 1e38 |
| Reputation | `getSummary(agentId, address[] clients, tag1, tag2) → (count, int128 summaryValue, uint8 decimals)`, `readAllFeedback(...)` | Panel: `clients = [denetçi]` ile sadece denetçinin notları |
| Validation | `validationRequest(address validator, uint256 agentId, string requestURI, bytes32 requestHash)` | Çağıran agentId'nin **sahibi** veya onaylı operatörü olmalı (`"Not authorized"`). `requestHash` benzersiz (`"exists"`) → her saat yeni hash |
| Validation | `validationResponse(bytes32 requestHash, uint8 response, string responseURI, bytes32 responseHash, string tag)` | Sadece istekte adı geçen validator (`"not validator"`), `response ≤ 100`. Aynı isteğe tekrar yanıt verilebilir (üzerine yazar, `lastUpdate` güncellenir) |
| Validation | `getSummary(agentId, address[] validators, tag) → (count, uint8 avgResponse)`, `getValidationStatus(requestHash)` | Panel için okuma |

**WorkshopHub** (Team1 atölye kaydı): `0x0a5aa2e3809fa20350182ac481dae69a043bc95d`. Kaynak: `omeraksu/autonomy-workshop` şablonundaki `config.ts`. 16 Ekim'de adreste kontrat kodu olduğu doğrulandı. Aynı adresten ikinci kayıt reddedilir: deneme `checkIn` yapma.

## 4. OKX TR ve ATK

### Profil düzeni (`~/.okx/config.toml`, repo dışında) [öneri]

| Profil | Anahtar izni | Ayarlar | Kullanan |
|---|---|---|---|
| `demo` | Okuma + İşlem | `site = "tr"`, `demo = true` | Trader yürütücüsü ve LLM araştırma süreci |
| `denetci` | **Sadece okuma** | `site = "tr"`, `demo = true` | Denetçi |
| `piyasa` | **Anahtar yok** | `site = "global"` (sadece bu satır) | LLM araştırma süreci: herkese açık global piyasa verisi. 17 Ekim'de kuruldu ve doğrulandı (`hasAuth: false`) |
| `demo-global` (yedek) | Okuma + İşlem | `site = "global"`, `demo = true` | TR demo çalışmazsa (17 Ekim: gerek kalmadı) |

Şablon: `ai-docs/templates/okx-config.example.toml`. Para çekme izni **asla** verilmez. Demo anahtarları canlı anahtarlardan ayrıdır (OKX → Demo Trading → API Management).

### 16 Ekim akşamı doğrulananlar (anahtarsız, canlı piyasa verisi)

- `okx --site tr market ticker BTC-USDT` çalışıyor; TR sitesinin herkese açık piyasa uç noktaları cevap veriyor.
- `USDT-TRY` var (son fiyat ~49,4 TRY).
- `BTC-TRY` var (son fiyat ~4.000.000 TRY). Emir defteri ilk bakışta: makas ~%0,13, ama en iyi alış/satış kademelerinde miktar küçük. 20 USDT'lik emrin kayması sabah ölçülecek.
- TR **demo** hesabı, özel uç noktalar ve demo emir henüz test edilmedi (ATK'nin kendi uyumluluk tablosunda TR "not yet tested").

### SİCİL'in kullandığı ATK araçları (adlar v1.4.8 kaynak kodu ve kataloğuyla doğrulandı)

| Ajan | Araç | Not |
|---|---|---|
| Trader | `market_get_candles` | `bar`: `1m…1H…1D`; varsayılan `1m`, `limit` varsayılan 100. **`demo: true`** demo piyasa verisini döndürür |
| Trader | `market_get_indicator`, `market_list_indicators` | Bilinmeyen indikatör adı sessizce boş döner; önce listeyi çağır |
| Trader | `market_get_orderbook`, `market_get_ticker` | Orderbook `sz` = kademe sayısı (en fazla 400); `demo` parametresi var |
| Trader | `account_get_balance`, `account_get_trade_fee` | `account_get_trade_fee` için `instType: "SPOT"` zorunlu. **17 Ekim, TR demo:** kademe Lv1, BTC-USDT/ETH-USDT (feeGroup 12) maker **%0,08**, taker **%0,10** (ilk dolumda da 0,08% görüldü). Ücretler eksi işaretli döner; alışta taban birimde (BTC) kesilir |
| Trader | `spot_place_order` | `tdMode: "cash"`, `ordType: "post_only"` için `px` zorunlu; `clOrdId` en fazla 32 karakter, harf+rakam |
| Trader | `spot_place_algo_order` | `ordType: "oco"`, `tpTriggerPx`/`tpOrdPx`, `slTriggerPx`/`slOrdPx` (`-1` = piyasa); `algoClOrdId` 1–32 harf+rakam; `sz` taban birimde |
| Trader | `spot_cancel_order`, `spot_get_order` | `spot_get_order`: `ordId` veya `clOrdId` |
| LLM (okuma, `piyasa` profili) | `market_get_funding_rate` | `instId` **-SWAP ile bitmeli** (`BTC-USDT-SWAP`, `ETH-USDT-SWAP`); `history: true` ile geçmiş. TR'de SWAP yok → global'den |
| LLM (okuma, `piyasa`) | `market_get_open_interest` | `instType: "SWAP"` zorunlu, `instId: "BTC-USDT-SWAP"` → `oi`, `oiCcy`, `oiUsd` |
| LLM (okuma, `piyasa`) | `market_filter_oi_change` | `instType: "SWAP"`, `bar` (5m/15m/1H/4H/1D), `minOiUsd`, `sortBy: absOiDeltaPct`; piyasa genelinde pozisyon birikimi/çözülmesi |
| LLM (okuma, `piyasa`) | `market_filter` | `instType` + `baseCcy`/`quoteCcy`; 24s değişim, hacim, funding, OI anlık görüntüsü |
| LLM (okuma, `piyasa`) | `market_get_indicator` (+ `market_list_indicators`) | `bar` varsayılan 1H; `params` sayı dizisi. 17 Ekim'de `ema [20]`, `atr [14]`, `adx [14]` BTC-USDT 1H çalıştı |
| ~~LLM (okuma)~~ | ~~`news_*`~~ | **Kaldırıldı (K-11, 17 Ekim):** demo modda kapalı. Canlı Read-only anahtarla sonra denenebilir |
| Denetçi | `spot_get_fills` | Varsayılan son **3 gün**; `archive: true` ile 3 aya kadar; `begin`/`end` ms |
| Denetçi | `spot_get_orders` | `status: open | history (7 gün) | archive (3 ay)` |
| Denetçi | `spot_get_fills`, `market_get_ticker` (`demo: true`) | Net getiri **sadece mühürlü işlemlerin dolumlarından** (bakiyeden değil; demo bakiyeleri ajanın değil) |
| Her ikisi | `system_get_capabilities` | Hangi modüller yüklü, demo mu, read-only mi |
| İz kaydı | `trade_get_history` | ATK MCP sunucusunun **yerel araç çağrısı kaydı** (audit log). İşlem geçmişi değildir; LLM'in araştırma izini kanıtlamak için kullanılabilir |

Alternatif: `spot_place_order` doğrudan `tpTriggerPx`/`slTriggerPx` alarak giriş emrine TP/SL iliştirebilir; ayrı OCO yerine kullanılabilir.

### Bilinen tuzaklar ve düzeltmeler

| Konu | Doğrusu |
|---|---|
| `account_get_audit_log` | **Yok.** Doğrusu `trade_get_history` (yerel araç çağrısı kaydı). `ai-docs/docs/01-okx-atk.md` düzeltildi |
| `account_get_fee_rates` | **Yok.** Doğrusu `account_get_trade_fee` |
| `spot_get_open_orders`, `spot_get_order_history`, `spot_get_fills_archive` | **Yok** (`ai-docs/sources/okx-atk/docs/modules/spot.md` eski adları listeliyor). v1.4.8'de doğrusu `spot_get_orders` (`status: open|history|archive`) ve `spot_get_fills` (`archive: true`). TOOL_CATALOG kazanır |
| ERC-8004 ABI | Repoda hiçbir kaynakta ABI/imza yok; §ERC-8004'teki fonksiyon adları ekip planından. Implementasyon kontratından (Snowtrace) doğrula |
| `swap_get_orders` | **Var** (adı kaynakta kalıpla üretiliyor, düz aramada görünmüyor). `swap_get_open_orders` / `swap_get_order_history` **yok**. SİCİL swap kullanmadığı için önemsiz; ekip planındaki bu düzeltme hatalı |
| `news` modülü | **Demo modda tamamen kapalı** (17 Ekim, TR demo: "not available in demo/simulated trading mode"). Açmak için canlı profil (sadece Read anahtar) veya OAuth (`okx-auth login`). Açılmazsa LLM sadece piyasa verisiyle karar verir |
| `smartmoney` modülü | Tasarım dokümanına göre sadece global uç noktalar; SİCİL kullanmıyor |
| Earn | Demo modda **desteklenmiyor**; kapsam dışı |
| Grid bot "demo'da yok" | Başlangıç dokümanının iddiası; resmi skill bunun tersini yazıyor. SİCİL için önemsiz |
| Demo piyasa verisi | Demo hesabın fiyatları canlı piyasadan farklı olabilir. Demo'da limit/post_only fiyatını **demo piyasa verisinden** (`demo: true`) hesapla; yoksa emir dolmaz veya reddedilir [doğrula] |
| OCO çıkış dolumları | **İki kez doğrulandı (17 Ekim; ikincisi yürütücünün kendi döngüsünde, mühür #1):** OCO `sicil000001x` SL tarafından tetiklendi → çıkış emri ordId `4017395256996507649`: `clOrdId = "O4017395256906630144"` (borsa üretimi), **`algoId = 4017373798534590465` ve `algoClOrdId = sicil000001x` emir kaydında VAR**; dolum kaydında (`tradeId 1415987055`) `algoClOrdId`/`algoId` **YOK** (null). İlk test (manuel, `sicil000002x`) aynı sonucu vermişti. tetiklenen emrin `clOrdId`'si borsa üretimi (`O<sayı>`), `algoClOrdId` sadece **emir** kaydında var, **dolum** kaydında yok. Denetçi: dolum → `ordId` → `spot_get_order`/`spot_get_orders` → `algoClOrdId` (`sicilNNNNNNx`) → mühür. Alternatif: algo geçmişindeki `ordIdList`. Bir emir birden çok dolum olarak gelir; `ordId`'ye göre grupla |
| Profilsiz MCP süreci | `--profile` verilmezse `default_profile` (demo) anahtarı kullanılır. Anahtarsız süreç için anahtarı olmayan ayrı profil (`piyasa`) gerekir |
| Fiyat kaynağı ayrımı | LLM'in gördüğü global veri **sadece bağlam** içindir. Emir fiyatı (`px`), stop ve tavan **her zaman TR demo verisinden** (`demo` profili, `demo: true`) hesaplanır |
| Smart registration | Dokümana göre Trade izni olmayan anahtarda emir araçları gizlenir; **TR demo'da gizlenmedi** (17 Ekim). Yazma araçlarını kapatmanın güvenilir yolu `--read-only` |
| CLI demo piyasa verisi | `--profile demo` tek başına yetmez; `market` komutlarında `--demo` (MCP'de `demo: true`) verilmezse canlı veri döner |
| Sayılar | Bütün sayısal parametreler **string** (`"sz": "0.0003"`) |
| Spot `sz` | Piyasa alımında `sz` = USDT; diğer bütün durumlarda taban birim (BTC). `tgtCcy` ile değiştirilebilir |
| Hata biçimi | MCP hataları exception değil, `"error": true` içeren JSON metin olarak döner (`code`, `message`, `suggestion`, `traceId`). CLI hata durumunda exit code 1 |
| Hız sınırı | ATK'de dahili hız sınırlayıcı var; döngü aralıkları saniyeler mertebesinde olmalı |
| ATK pozisyon alanları | Pozisyon araçları OKX yanıtını kırpmadan aktarıyor (paket kodundan doğrulandı). SİCİL spot olduğu için önemsiz |

## 5. MCP bağlantıları (Claude Code geliştirme ortamı)

Repo kökündeki `.mcp.json`:
- `avalanche-docs`: Avalanche resmi doküman MCP'si (HTTP).
- `okx-demo`: `demo` profiliyle `market,spot,account` (news 17 Ekim'de çıkarıldı), **`--read-only`**; geliştirirken gerçek yanıt biçimlerini görmek için. Emir atamaz: geliştirme sırasında sicil kirlenmesin. Sabahki emir testleri gerekirse elle CLI ile yapılır.
- `okx-market`: `piyasa` profiliyle (anahtarsız, global) `market`, `--read-only`. Profil verilmezse `default_profile = "demo"` devreye girip demo anahtarını kullanıyordu (17 Ekim'de görüldü: `hasAuth: true, demo: true`).

Claude Code açılışta bu sunucuları onaylamanı ister; `/mcp` ile bağlı olduklarını kontrol et.

## 6. Önerilen repo düzeni [öneri]

```
sicil/
├── contracts/          Foundry projesi (src/SicilKasasi.sol, test/, script/)
├── agents/
│   ├── trader/         kural motoru, LLM karar katmanı, yürütücü
│   ├── denetci/        eşleştirme, tez puanlama, attest, ERC-8004
│   └── shared/         ATK MCP istemcisi, viem istemcisi, hash/commit yardımcıları
├── panel/              Türkçe panel
├── reports/            denetçi rapor JSON'ları (repoda; hash'leri zincirde)
├── memory-bank/        bu klasör
└── ai-docs/            başlangıç kiti dokümanları
```

## 7. Yararlı komutlar

```bash
okx --version                                   # 1.4.8
okx diagnose
okx --site tr market ticker BTC-USDT
okx --profile demo account balance --json
okx list-tools --json                           # yüklü sürümdeki bütün araçlar
forge build && forge test -vv
cast chain-id --rpc-url https://api.avax-test.network/ext/bc/C/rpc     # 43113
cast balance <ADRES> --ether --rpc-url https://api.avax-test.network/ext/bc/C/rpc
```
