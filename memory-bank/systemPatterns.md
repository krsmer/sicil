# System Patterns: SİCİL

> Etiketler: **[karar]** ekip planında kesinleşmiş · **[öneri]** tasarım önerisi, kod yazarken netleştirilecek · **[doğrula]** sabah test edilmeden güvenilmeyecek.

![Mimari](assets/mimari.png)

## 1. Bileşenler

| Bileşen | Nerede | Görevi | Anahtar / cüzdan |
|---|---|---|---|
| **Trader ajan** | Zincir dışı (Node) | Kural motoru aday üretir; LLM araştırır, karar verir, tez yazar; yürütücü mühürler, emir gönderir, açıklar | OKX anahtarı: okuma + işlem · Fuji: `sicil-trader` |
| **Denetçi ajan** | Zincir dışı (Node) | Hesabın bütün dolan işlemlerini çeker, mühürlerle eşler, tezleri puanlar, rapor ve not yazar. **LLM kullanmaz.** | OKX anahtarı: **sadece okuma** · Fuji: `sicil-denetci` |
| **SicilKasasi** | Avalanche Fuji | Mühür (limit kontrolü), açıklama (hash doğrulama), denetim raporu, fren | — |
| **ERC-8004 kayıtları** | Avalanche Fuji (resmi, hazır) | Identity (agentId), Reputation (notlar), Validation (denetim puanı) | — |
| **Türkçe panel** | Tarayıcı | Aynı zincir olaylarını ve rapor JSON'larını okuyup gösterir | Sadece okuma |
| **Fren** | Jüri üyesinin telefonu (Core) | `pause()` | `sicil-fren` veya telefonda açılacak Core cüzdanı (açık karar) |

**Temel ilke [karar]:** İki ajan birbirine doğrudan mesaj göndermez; birbirine **sadece zincir üzerinden** güvenir. Trader işlem yapar, denetçi kanıtlar.

## 2. Veri akışı

```
1  Trader   → SicilKasasi.seal(commitHash, pair, notionalUsdt)      [limitler burada kontrol edilir]
2  Trader   → OKX TR spot: post_only limit emir, clOrdId = mühür no
3  Trader   → SicilKasasi.reveal(id, side, priceE8, sizeE8, thesis, confidence, salt, okxOrdId)
4  Denetçi  ← OKX TR: bütün dolan işlemler (spot_get_fills) + emirler (spot_get_orders)
5  Denetçi  ← SicilKasasi olayları (Sealed, Revealed)
6  Denetçi  → SicilKasasi.attest(upToTs, matched, unmatched, dayPnlBps, reportHash)
7  Denetçi  → ERC-8004: Reputation.giveFeedback (net getiri, kalibrasyon) + Validation.validationResponse
8  Fren     → SicilKasasi.pause()
Panel      ← 1–8'in bütün olayları + reports/*.json
```

## 3. Roller ve yetkiler [karar]

| Rol | Fuji adresi | Kontratta yetkisi |
|---|---|---|
| Sahip (ekip) | `0x8394359d719ccD2cf037Edde7c50011D3cB690A8` | Deploy'da limitleri belirler, `unpause`, `report` (WorkshopHub kaydı); ERC-8004: trader agentId'sinin **sahibi**, saatlik `validationRequest` (K-12) |
| Trader | `0x7c9931802977377aa62315DaebE1D455a2874E07` | `seal`, `reveal` |
| Denetçi | `0x963261691606dCe9C4C9Bd0a5181371BB4eE3D02` | `attest`; ERC-8004 Reputation/Validation yazımı; kendi agentId'sinin sahibi; **asla sahibin operatörü değil** (K-12) |
| Fren (guardian) | `0x9F37AaAeA7a216C2d6fB790707841B39086FCFE3` (keystore) | `pause` |

Fren için açık karar: telefondaki Core'da yeni bir cüzdan açılırsa onun adresi kullanılır ve bu tablo güncellenir.

## 4. SicilKasasi kontratı

**Immutable değerler [karar]:** Türkçe kuraldan gelir, deploy'da belirlenir, sonradan değişmez.
- İzinli pariteler (ör. `BTC-USDT`, `ETH-USDT`)
- İşlem başı maksimum tutar (USDT, ör. 20)
- Bekleme süresi (iki mühür arası, saniye)
- Günlük maksimum zarar (USDT veya baz puan, ör. 50 USDT)
- Rol adresleri: sahip, trader, denetçi, fren
- **`sicilBaslangic`** (zaman damgası) [karar, 16 Ekim gece]: sicilin başladığı an. Denetçi sadece bu andan **sonraki** dolumları tarar. Sabahki testler ve geliştirme sırasında aynı demo hesapta atılan emirler sicile girmez. Ajanın canlıya geçtiği ana (planda 12:30) denk getirilir; deploy'da verilir ya da sahip tarafından **bir kez** ayarlanır (sonra değişmez).

**Fonksiyonlar [karar]:**

| Fonksiyon | Çağıran | Kontrol | Olay |
|---|---|---|---|
| `seal(commitHash, pair, notionalUsdt)` | Trader | Parite izinli mi, tutar limitin altında mı, bekleme süresi doldu mu, kontrat durdurulmuş mu | `Sealed(id, commitHash, pair, notional, ts)` |
| `reveal(id, side, priceE8, sizeE8, thesis, confidence, salt, okxOrdId)` | Trader | `keccak256(abi.encode(pair, side, priceE8, sizeE8, thesis, confidence, salt))` mühürdekiyle aynı mı | `Revealed(id, side, priceE8, okxOrdId)` |
| `attest(upToTs, matched, unmatched, dayPnlBps, reportHash)` | Denetçi | `unmatched > 0` ise sicil bozuk; günlük zarar limiti aşıldıysa otomatik fren | `Attested`, `SicilBozuldu`, `Paused` |
| `pause()` | Fren veya sahip | — | `Paused(by)` |
| `unpause()` | Sahip | — | `Unpaused` |
| `report(hub, name, agentId)` | Sahip | WorkshopHub'a `checkIn`; hub sadece kontrattan gelen çağrıyı kabul ediyor | — |

**Neden parite ve tutar açık, yön gizli [karar]:** Limitlerin emir gitmeden uygulanabilmesi için parite ve tutar mühürde açık. Yön, fiyat ve yapay zekânın tezi hash'in içinde; işlem dolduktan sonra açıklanır. Amaç: sinyal işlemden önce kopyalanamasın.

**Önerilen tipler [öneri]:** `pair: string`, `side: uint8` (0 = al, 1 = sat), `priceE8, sizeE8: uint256` (1e8 ölçekli), `thesis: string` (kısa JSON veya düz metin), `confidence: uint8` (0–100), `salt: bytes32` (her mühür için rastgele), `okxOrdId: string`. Hash'i hem zincir dışında (viem `encodeAbiParameters` + `keccak256`) hem kontratta **aynı sırayla** üret; Foundry testinde eşleştiğini kanıtla.

**Açıklanmamış mühür kuralı [karar, 16 Ekim gece]:** Süresi dolduğu halde `reveal` edilmemiş her mühür **"tutmadı"** sayılır ve denetçi raporunda ayrı bir kalem olarak gösterilir. Böylece ajan kaybettiren tezleri hiç açıklamayarak kalibrasyonunu güzelleştiremez ("seçerek gösterme yok" kuralının mühür tarafı). Emir hiç gönderilemediyse bile `reveal` yapılır (`okxOrdId` boş).

**`SicilBozuldu` kalıcıdır [karar]:** Bir kez yazılınca geri alınamaz. Sunumdaki cümle: "Bu kırmızı artık silinemez. Benim tarafımdan bile."

**Foundry testleri [karar]:** limit aşımı reddi, hash eşleşmesi (doğru/yanlış), fren (pause/unpause yetkileri), sicil bozulması, `sicilBaslangic`'in sadece bir kez ayarlanabilmesi.

**Ret kaydının zincirde görünmesi [öneri, önemli]:** Sunumda "kontrat 34 USDT'yi reddetti" anı gösterilecek. viem gibi kütüphaneler işlemi göndermeden önce simüle eder; revert edecek işlemi **hiç göndermez**, ret zincirde iz bırakmaz. Ret anının Snowtrace'te görünmesi için limit aşan `seal` çağrısı **simülasyonsuz ve sabit gas limitiyle** gönderilmeli (reverted tx zincirde kalır). Yerel log'a da yazılır.

## 5. Trader ajanın karar döngüsü

```
her tur (saatlik mum kapanışı; sakin piyasada 15 dakika):
  1. Kural motoru: BTC-USDT, ETH-USDT için rejim (EMA eğimi/ADX) + ATR
     → aday: {pair, yön, giriş, tavanBoyutUsdt, zorunluStop, hedefAraligi}
  2. LLM araştırır: kendi seçtiği okuma araçlarıyla (başka zaman dilimi mumları,
     emir defteri; global türev bağlamı: market_get_funding_rate BTC/ETH-USDT-SWAP,
     market_get_open_interest, market_filter_oi_change, market_filter, market_get_indicator)
  3. LLM karar verir → JSON: AL | BEKLE | PAS (+ AL ise tez)
  4. Sınırlar: boyut = tavan × boyutCarpani (0–1, sadece küçültür); stop zorunlu
  5. salt üret → commitHash hesapla → seal() → Sealed(id) onayını bekle
  6. spot_place_order: ordType=post_only, px, sz, clOrdId="sicil" + id (6 hane)
  7. Belirli sürede dolmazsa spot_cancel_order
  8. Dolunca: reveal(...okxOrdId) → spot_place_algo_order (OCO: TP + SL, ATR katları)
  9. Yerel log'a (JSONL) yaz: aday, LLM girdisi/çıktısı, araç çağrıları, tx hash'leri
```

**LLM çıktı şeması [öneri]** (şemaya uymayan cevap = BEKLE):

```json
{
  "karar": "AL",
  "tez": { "hedefPct": 1.5, "gecersizlikPct": 0.8, "sureDk": 120, "guven": 65 },
  "boyutCarpani": 0.7,
  "gerekce": "Saatlik trend güçlü, 15 dakikalık mumlar onaylıyor, emir defteri alım tarafında derin.",
  "arastirma": ["market_get_candles 15m", "market_get_orderbook", "market_get_funding_rate BTC-USDT-SWAP"]
}
```

- LLM **sayı uydurmaz**: fiyat, stop ve tavan kural motorundan gelir; LLM sadece `boyutCarpani ≤ 1` verebilir.
- LLM her kararda **son 10 tezinin sonucunu ve kalibrasyonunu** görür ve güvenini buna göre ayarlar [karar].
- Zaman aşımı, bozuk JSON veya hata → **BEKLE**. Yeni işlem açılmaz; açık pozisyonların OCO'su borsada durduğu için korunur [karar].
- Tez süresi [öneri]: **60–120 dakika**. 4 saatlik tezler 19:00 teslimine ve 20:00 sunumuna kadar sonuçlanmayabilir; kalibrasyon için akşama 10+ sonuçlanmış tez gerekir.

## 6. Denetçi ajanın döngüsü

```
her tur (normalde 60 sn; sunum sırasında 15 sn):
  1. spot_get_fills (begin = sicilBaslangic) + spot_get_orders → sicil başladıktan sonraki bütün dolan işlemler ve emirler
  2. SicilKasasi olayları: Sealed, Revealed
  3. Her dolum için eşleştirme:
       clOrdId "sicilNNNNNN" → mühür id   (yedek: reveal içindeki okxOrdId)
       mühür zamanı < emir oluşturma zamanı olmalı
     eşleşmeyen dolum = mühürsüz işlem
  4. Net getiri: account_get_balance + market_get_ticker (gün başı özsermayeye göre, ücret dahil)
  5. Süresi dolan tezleri puanla (bkz. §7); süresi dolup açıklanmamış mühürleri "tutmadı" say ve raporda ayrıca listele
  6. reports/<zaman>.json yaz → keccak256 → attest(upToTs, matched, unmatched, dayPnlBps, reportHash)
  7. Saatte bir: Reputation.giveFeedback (net getiri, kalibrasyon) + Validation.validationResponse
```

**OCO çıkış emirleri [doğrulandı 17 Ekim: dolumda `algoClOrdId` yok, emirde var; eşleştirme dolum → ordId → emir → algoClOrdId zinciriyle yapılır, bkz. `techContext.md` §4]:** Kâr al / zarar durdur tetiklendiğinde borsa **yeni bir emir** oluşturur; onun `ordId`'si ve `clOrdId`'si giriş emrinden farklıdır. Denetçi bu çıkış dolumlarını eşleştiremezse **kendi ajanımızın meşru çıkışlarını "mühürsüz işlem" diye işaretler** ve sicil yanlışlıkla bozulur. Öneri: OCO'yu `algoClOrdId = "sicil" + id + "x"` ile ver; denetçi çıkış dolumlarını `algoId`/`algoClOrdId` üzerinden ana mühre bağlasın. Sabah kontrol: tetiklenen OCO emrinin dolum/emir kaydında `algoId` veya `algoClOrdId` görünüyor mu?

**Rapor JSON'u [karar]:** Kontrol edilen zaman aralığı (`sicilBaslangic`'ten itibaren), işlem sayısı, eşleşen, eşleşmeyen, açıklanmamış mühürler, net getiri. `feedbackURI` ve `responseURI` repodaki bu JSON'u gösterir; hash'i zincirdedir.

## 7. Tez puanlama ve kalibrasyon

- Süre dolunca denetçi mum verisine bakar: fiyat **önce hedefe mi, yoksa geçersizlik seviyesine mi** ulaştı? Kurallı ve herkes tarafından tekrarlanabilir [karar].
- Açıklanmamış mühürler (süre doldu, `reveal` yok) puanlamaya **"tutmadı"** olarak girer [karar].
- [öneri] 1 dakikalık mumlar kullanılır (`market_get_candles`, `bar: "1m"`). Aynı mum içinde ikisine birden dokunulursa sıra belirsizdir → **"tutmadı"** sayılır (temkinli kural). Süre dolduğunda hiçbirine dokunulmadıysa → "tutmadı".
- **Brier skoru:** `ortalama((güven/100 − sonuç)²)`, sonuç = 1 (tuttu) veya 0. Düşük skor = iyi kalibrasyon. Reputation'a ayrı not olarak yazılır [karar].
- Sunumda örnek sayısının az olduğu dürüstçe söylenir.

## 8. Hata ve kesinti davranışları (fail-closed)

| Durum | Davranış |
|---|---|
| LLM zaman aşımı / bozuk cevap | BEKLE; yeni işlem yok |
| Fuji RPC erişilemiyor | Mühür atılamaz → emir gönderilmez. Yedek RPC denenir. Açık pozisyonlar OCO ile korunur |
| `seal` limit nedeniyle revert | Emir gönderilmez; kural motoru tutarı düşürüp yeniden dener; ret yerel log'a ve (simülasyonsuz gönderildiyse) zincire düşer |
| `post_only` emir dolmuyor | Süre sonunda iptal; reveal yine yapılır (okxOrdId ile), dolum yok |
| Mühür atıldı ama emir OKX'e gidemedi | Reveal `okxOrdId` boş olarak yapılır [öneri]; denetçi açısından dolum olmadığı için eşleşmezlik yok |
| Kontrat `Paused` | Trader yeni mühür atamaz → yeni emir yok. Panel "durduruldu" gösterir |
| Mühür atıldı, süre doldu, `reveal` yok | "Tutmadı" sayılır, raporda ayrıca gösterilir |
| Geliştirme/test emirleri | `sicilBaslangic`'ten önceyse sicile girmez; Claude Code'un `okx-demo` bağlantısı `--read-only` olduğu için geliştirme sırasında emir atılamaz |
| ATK hata JSON'u (`"error": true`) | `suggestion` alanı log'a yazılır; tur atlanır |

## 9. ATK bağlantı düzeni [öneri]

Üç ayrı `okx-trade-mcp` süreci; her biri en az yetkiyle:

| Süreç | Kullanan | Komut (taslak) | Neden |
|---|---|---|---|
| Yürütücü | Trader kodu (LLM değil) | `okx-trade-mcp --profile <trader> --modules spot,account,market` | Emir yazabilen tek yer |
| Araştırma | LLM | `okx-trade-mcp --profile piyasa --read-only --modules market` (anahtarsız, global) [karar K-11] | LLM'in sürecinde **anahtar bile yok**; emir veremediği mimariyle garanti. TR demo verisi (fiyat, emir defteri) yürütücü kodu üzerinden LLM'e verilir |
| Denetim | Denetçi kodu | `okx-trade-mcp --profile <denetçi> --read-only --modules spot,account,market` | Sadece okuma anahtarı + read-only |

`--read-only` bütün yazma araçlarını kapatır. Jüri "LLM emir verebilir mi?" diye sorarsa cevap: "LLM'in bağlandığı süreçte yazma aracı hiç yok."

## 10. ERC-8004 entegrasyonu [karar]

| Kayıt | Fuji proxy | Kullanım |
|---|---|---|
| Identity | `0x8004A818BFB912233c491871b3d84c89A494BD9e` | `register(agentURI)` → trader ve denetçi ayrı agentId |
| Reputation | `0x8004B663056A597Dffe9eCcC1965A193B7388713` | Denetçi → trader: `giveFeedback(agentId, value, valueDecimals, tag1, tag2, endpoint, feedbackURI, feedbackHash)`; `value` baz puan, `valueDecimals = 2`; iki ayrı not: net getiri ve kalibrasyon |
| Validation | `0x8004Cb1BF31DAf7788923b405b754f57acEB4272` | Trader'ın sahibi her saat `validationRequest(validator, agentId, requestURI, requestHash)`; denetçi `validationResponse(requestHash, response, responseURI, responseHash, tag)` ile 0–100 puan verir |

- Kayıtlar yükseltilebilir proxy; imzalar ve kurallar 17 Ekim'de kaynak koddan doğrulandı (`techContext.md` §3, ABI'ler `agents/shared/abi/`).
- Ajan sahibinin (ve onaylı operatörün) kendi ajanına not vermesi **kontratta engelli** (`"Self-feedback not allowed"`, doğrulandı); denetçinin ayrı cüzdan olması bunu çözüyor. Denetçi trader agentId'sinin sahibi/operatörü yapılmamalı.
- [karar K-12] Trader agentId'sini **sahip** kaydeder (agentURI JSON'unda trader adresi); `validationRequest`'i sahip çağırır. `agentWallet` kayıtta sahip adresi olur; trader'a bağlayan `setAgentWallet` vakit kalırsa en sona.
- Not verme engellenirse yedek: kontrattaki `Attested` olayı kullanılır.

**WorkshopHub:** Ömer Aksu'nun atölye kontratı, Fuji adresi `0x0a5aa2e3809fa20350182ac481dae69a043bc95d` (şablonun `config.ts` dosyasında yazıyor; 16 Ekim'de adreste kontrat kodu olduğu doğrulandı). Aynı adresten ikinci kaydı reddediyor; `checkIn`'i sabah deneme olarak **yapma**, sadece final kontrattan, gerçek isimle çağır. Repo lisanssız: kod kopyalanmaz, sadece arayüz kullanılır ve sunumda atıf yapılır.

## 11. Panel

- Zincir olayları: viem `getLogs` / `watchContractEvent` (salon Wi-Fi'si için 2–5 sn polling yedeği).
- Gösterilecekler: temiz/bozuk sicil durumu, işlem ve mühür sayısı, net getiri, en büyük düşüş, tez listesi (tuttu/tutmadı), kalibrasyon, PAS kararları, ret kayıtları, fren durumu.
- Her satırda Snowtrace linki: `https://testnet.snowtrace.io/tx/<hash>`.
- Arayüz dili Türkçe.

## 12. ANAYASA'ya iniş (B planı) [karar]

14:00'te döngü çalışmıyorsa: denetçi bırakılır; `seal`'deki limit kontrolü "kural kapısı" olarak sunulur; Türkçe kural kartı, ret anı ve jüri freni gösterilir. Kontrat, yürütücü ve panel aynen kalır.
