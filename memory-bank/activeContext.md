# Active Context

> Bu dosya "şu an neredeyiz" sorusunun cevabı. Her görevden sonra güncellenir; en yeni kayıt en üstte.

## Şu anki durum (16 Ekim 2026, ~21:00)

**Aşama:** Hackathon'dan önceki gece. Kod yazılmıyor, sadece kurulum ve hazırlık yapılıyor.
**Odak:** Gece işleri listesini bitirip sabahki kontrol listesini 45 dakikadan 15 dakikaya indirmek.
**Proje kararı kesin:** SİCİL ana proje, ANAYASA B planı. Plan donduruldu; ayrıntılar süreç içinde düzeltilecek.

## Sıradaki adımlar (sırayla)

1. **OKX TR API anahtarları** (insan yapar):
   - Demo trading erişimi var mı bakılacak.
   - Trader anahtarı: Okuma + İşlem. Denetçi anahtarı: sadece Okuma. Para çekme kapalı.
   - `okx config init` ile `~/.okx/config.toml`: `demo` ve `denetci` profilleri (`site = "tr"`, `demo = true`).
   - Anahtarlar sohbete, koda, log'a **asla** yazılmaz.
2. Profil testleri: `okx --profile demo account balance`, `okx --profile denetci account balance`.
3. Fren cüzdanı kararı (aşağıda açık kararlar).
4. Slayt 1 için "örnek" etiketli sahte sinyal ekran görüntüsü.
5. Slayt iskeleti ve sunum metni (`demoScript.md` hazır, slayta dökülecek).
6. İş bölümü: isimleri `progress.md` saat planına yaz.
7. Organizatör kanalı varsa sor: "önceden kod/şablon serbest mi?"

## Ekip incelemesinden gelen kararlar (16 Ekim gece)

Ekip arkadaşının zip incelemesinde bulunan eksikler; plana eklendi:

1. **Test emirleri sicili bozmasın:** Kontrata `sicilBaslangic` zamanı eklendi; denetçi sadece o andan sonrasını tarar. Claude Code'un `okx-demo` bağlantısı `--read-only` yapıldı. (`systemPatterns.md` §4, §6, §8)
2. **Açıklanmamış mühür kaçağı kapandı:** Süresi dolup açıklanmamış mühür "tutmadı" sayılır, denetçi raporlar. (`systemPatterns.md` §4, §7)
3. **İlk commit kuralı:** Bu gece commit atılmaz. Repo yarın 10:00'da açılır, ilk commit orada. Hazır dokümanları getirmenin serbest olup olmadığı sabah organizatöre sorulur.
4. **WorkshopHub adresi:** `0x0a5aa2e3809fa20350182ac481dae69a043bc95d` (Fuji'de kontrat kodu doğrulandı).

Ayrıca: keystore şifreleri düz metin olduğu için cüzdanlar sadece test içindir; fren için telefonda yeni Core cüzdanı tercih ediliyor. Bütün cüzdanlar Arif'in Mac'inde; kontrat ve paneli başkası yazsa bile deploy ve ajanlar orada çalışır.

## Açık kararlar

| Karar | Seçenekler | Öneri / not |
|---|---|---|
| ~~Fren cüzdanı~~ | **K-14 (17 Ekim): bilgisayardaki Core tarayıcı eklentisi hesabı**; panelde "Freni çek" → EIP-1193 ile `pause()`, jüri Core penceresinde onaylar | Adres `0xFD056f1A62c5316767Ec0ee36874bAeE1271c35e` (~0,01 AVAX). `SicilKasasi` bununla deploy edildi |
| ~~Tez süresi~~ | **60–120 dk (K-15)** | — |
| ~~LLM sağlayıcısı ve modeli~~ | **K-16: Gemini `gemini-3.8-flash`** (K-15'teki Sonnet 5.5 yerine) | 4 araç / 45 sn, aşılırsa BEKLE; 1H rejim + 15m giriş; tez 60–120 dk |
| ~~Trader agentId'sini kim `register` eder~~ | **K-12 (17 Ekim): sahip kaydeder**, agentURI'de trader adresi; denetçi kendini kaydeder, asla sahibin operatörü olmaz; saatlik `validationRequest` sahipten; `setAgentWallet` en sona (≤20 dk) | Önceki not: **Kaynak koddan (17 Ekim):** `register` çağıranı sahip yapar ve `agentWallet`'ı otomatik çağıran adres yapar. Trader kendini kaydederse kimlik doğrudan mühürleyen cüzdana bağlanır, `validationRequest`'i trader çağırır. Sahip kaydederse `agentWallet` için ayrıca imzalı `setAgentWallet` gerekir, `validationRequest`'i sahip çağırır, ama "sahibin bütün ajanları" (`balanceOf(sahip)`) görünür. İki durumda da denetçi not verebilir |
| PAS kararları ve adaylar zincire yazılsın mı | Hayır (plan) · Ucuz bir olayla evet | Plan "PAS dediği aday gösterilir" diyor ama PAS kararları zincire yazılmıyor; jüri "sonradan seçtiniz" diyebilir. Zaman kalırsa küçük bir olayla mühürlenebilir |
| Canlı hesap (Bonus 1) | Sadece demo · Küçük canlı alt hesap (10–20 USDT) | Organizatöre "demo sayılıyor mu" sorulacak. Canlıysa: alt hesap, para çekme kapalı, IP kısıtlı |
| ~~BTC-TRY paritesi~~ | **Eklenmedi (17 Ekim 12:30)** | Canlı TR'de kayma kabul edilebilir (5,8 bps, makas 11,5 bps) ama **demo BTC-TRY defteri bozuk** (orta fiyat 130 TRY); demoda işlem yapılamaz. Canlıya geçilirse yeniden değerlendirilir |
| Canlı yakalama nerede | Ana hesap (plan: kalıcı kırmızı) · İkinci hesap | Plan ana hesap. TR demo'da uygulamadan elle işlem yapılamıyorsa mühürsüz emir gönderen küçük bir script yedek |

## Bilinen riskler (aktif)

- **TR demo çalışmayabilir** (ATK'de "not yet tested"). Karar 10:30'da; çalışmazsa küçük canlı spot hesap ya da global demo.
- ~~OCO çıkış dolumları~~ Çözüldü (17 Ekim 12:05): emir kaydındaki `algoClOrdId` ile eşlenir.
- **`news` demo modda kapalı** (doğrulandı) → K-11: haber yok, LLM global türev verisiyle araştırıyor. Vakit kalırsa canlı Read-only anahtarla `news` (seçenek a).
- **Demo fiyatları canlıdan farklı olabilir.** Limit fiyatı demo piyasa verisinden hesapla.

## Son değişiklikler

- **17 Ekim ~13:20 · K-16:** LLM Gemini `gemini-3.8-flash`'e geçti; sahte adayla doğrulandı (3 araç, 20 sn, geçerli JSON). Sıradaki: `sicil-baslat --onayla` (Arif'in son onayıyla) → ajanı arka planda başlat.
- **17 Ekim ~13:10:** Ajan döngüsü yazıldı: `agents/trader/ajan.mjs` (15m tur, 1H rejim + 15m giriş, LLM `karar.mjs`, ret anı saatte en fazla bir, açık pozisyonlu pariteye giriş yok, kasa durdurulmuşsa tur atlanır). LLM yolu **API anahtarı bekliyor** (`.env` → `ANTHROPIC_API_KEY`). Tek tur denemesi: iki parite yatay, aday yok. Sıradaki: anahtar → LLM testi → `sicil-baslat --onayla` → ajanı arka planda başlat.
- **17 Ekim ~13:00 · K-15:** LLM = Claude Sonnet 5.5; 1H rejim + 15m giriş; 4 araç / 45 sn → BEKLE; tez 60–120 dk. OCO çıkışı yürütücü döngüsünde tetiklendi ve doğrulandı (techContext §4).
- **17 Ekim ~12:40:** İlk uçtan uca döngü: mühür #1 → `sicil000001` post_only alış (~29 sn'de doldu) → reveal → OCO `sicil000001x`. Düzeltmeler (Arif): (1) dayPnl **sadece mühürlü işlemlerin dolumlarından** (bakiyeden değil) → systemPatterns §6; (2) **sicili başlatmadan önce açık emir/algo emir olmamalı** → kural systemPatterns §4 + `agents/trader/sicil-baslat.mjs` otomatik kontrol (kuru modda bekleyen OCO'yu yakaladı, exit 2); (3) demo ücret Lv1: maker %0,08 / taker %0,10 → productContext + demoScript dürüstleştirildi. Sıradaki: OCO tetiklenme doğrulaması → kural motoru + LLM → simülasyonsuz ret mührü → canlıya alma (~14:00).
- **17 Ekim ~13:25:** **`SicilKasasi` Fuji'de: `0x60735035CC6f4d810f4878f9A4a1993F534fe6a8`** (tx `0x75eeb4ca34…`), fren = Core `0xFD056f…`. Zincirden okunan ayarlar doğru (BTC-USDT/ETH-USDT, 2000/300/5000/10800, `sicilBaslangic = 0`). Builder Hub `exact_match` ve Snowtrace verified. Sıradaki: trader yürütücüsü (seal → emir → reveal döngüsü); `setSicilBaslangic` trader canlıya geçince.
- **17 Ekim ~12:50 · K-14:** Fren = Core tarayıcı eklentisi hesabı; panelde EIP-1193 "Freni çek" butonu. `SicilKasasi` deploy'u Core adresini bekliyor.
- **17 Ekim ~12:45 · K-13:** `SicilKasasi` yazıldı (`contracts/src/SicilKasasi.sol`), 28/28 Foundry testi geçiyor (viem hash eşleşmesi `ffi` ile kanıtlı). Sıradaki: Fuji deploy + verify (Builder Hub + Snowtrace), sonra `setSicilBaslangic`.
- **17 Ekim ~12:35:** ERC-8004 kayıtları yapıldı: **trader agentId 258** (sahibi sahip cüzdanı), **denetçi agentId 259** (sahibi denetçi). `isAuthorizedOrOwner(denetçi, 258) = false` doğrulandı. agentURI'ler data URI olarak zincirde (`agents/registration/`). Sıradaki: `SicilKasasi`.
- **17 Ekim ~12:25 · K-12:** Trader agentId'sini sahip kaydedecek (agentURI'de trader adresi), denetçi kendini; denetçi asla sahibin operatörü değil; `validationRequest` sahipten; `setAgentWallet` vakit kalırsa en sona (≤20 dk). demoScript'teki "10 hesap" cevabı geçerli.
- **17 Ekim ~12:15:** ERC-8004 kayıtlarının doğrulanmış kaynak kodu okundu; imzalar planla uyumlu, `Self-feedback not allowed` kontrolü var, `value` negatif olabilir. ABI'ler `agents/shared/abi/`.
- **17 Ekim ~12:00:** `contracts/` Foundry projesi kuruldu; `SicilPing` Fuji'ye deploy edildi (`0xDf769dE9Fc427863C8CC4cf7231226a93c2435f6`) ve Builder Hub + Snowtrace'te verify edildi. Deploy/verify hattı hazır; sıradaki: ERC-8004 imzaları, sonra `SicilKasasi`.
- **17 Ekim ~12:30:** BTC-TRY ölçüldü: canlıda kayma 5,8 bps, demo defteri kullanılamaz → BTC-TRY eklenmedi; pariteler BTC-USDT, ETH-USDT. Sabah listesinin OKX bölümü bitti. Sıradaki: Avalanche (boş kontrat deploy + verify, ERC-8004 imzaları).
- **17 Ekim ~12:25:** Repo açıldı: https://github.com/krsmer/sicil (**private**), `main`, ilk commit `3ad78cd`. Teslimde public'e çevrilecek; öncesinde commit e-postası ve `ai-docs/sources/` lisansı gözden geçirilecek.
- **17 Ekim ~12:15 · K-11:** `news` kaldırıldı. LLM araştırma süreci: `okx-trade-mcp --profile piyasa --read-only --modules market` (anahtarsız, global; `~/.okx/config.toml`'a `piyasa` profili eklendi). Funding (BTC/ETH-USDT-SWAP), OI, OI değişim taraması, market_filter, indikatörler (ema/atr/adx) anahtarsız doğrulandı. Global veri sadece bağlam; emir fiyatı TR demo'dan. `.mcp.json` güncellendi. (a) seçeneği vakit kalırsa.
- **17 Ekim ~12:05:** OCO riski çözüldü: tetiklenen çıkış emrinde `algoClOrdId` var (dolumda yok) → denetçi dolum→ordId→emir zinciriyle eşler. `news` demo modda kapalı; karar bekliyor (canlı Read-only anahtar / OAuth / haberi bırak).
- **17 Ekim ~11:45:** 10:30 kapısı geçti: TR demo'da `post_only` + `clOrdId=sicil000001` emri gönderildi, geri okundu, iptal edildi. Sıradaki: OCO + `algoClOrdId` testi.
- **17 Ekim ~11:40:** `denetci` profili kuruldu ve doğrulandı. Smart registration TR demo'da yazma araçlarını gizlemiyor → `--read-only` zorunlu (`techContext.md` §4).
- **17 Ekim ~11:27:** TR demo var (More → Demo trading; API: profil → Demo Trading API). `demo` profili kuruldu, bakiye ve demo piyasa verisi doğrulandı. Şablon dosyasına yanlışlıkla girilen passphrase temizlendi (şablon repoda; gerçek config `~/.okx/config.toml`).
- **17 Ekim:** Repo baştan sona tarandı (memory bank, ai-docs rehberleri, şablonlar, ATK kataloğu, kaynaklar). Bulunanlar: `~/.okx/config.toml` yok; PATH'teki Node v25.6.1; `spot.md` modül dokümanında v1.4.8'de olmayan araç adları; repoda ERC-8004 ABI kaynağı yok. `techContext.md` ve `progress.md` doğrulama kaydına işlendi.
- **16 Ekim, ~21:30:** Ekip incelemesinden gelen 4 eksik eklendi (`sicilBaslangic`, açıklanmamış mühür kuralı, ilk commit kuralı, WorkshopHub adresi); `.mcp.json`'daki `okx-demo` read-only yapıldı.
- **16 Ekim, ~21:00:** Memory bank oluşturuldu. `ai-docs/docs/01-okx-atk.md` ve `ai-docs/hackathon/HACKATHON_BILGI.md` içindeki yanlış araç adları düzeltildi; `AGENTS.md`'ye proje notları ve memory bank okuma kuralı eklendi; `.mcp.json` spot projesine göre güncellendi; `okx-config.example.toml`'a `denetci` profili eklendi.
- **16 Ekim, ~20:45:** 4 Fuji keystore'u oluşturuldu ve faucet'ten alınan 0,49 AVAX dağıtıldı.
- **16 Ekim, ~20:35:** ATK 1.4.8 ve Foundry 1.8.5 kuruldu; TR piyasa verisi, Fuji RPC ve cancun derlemesi test edildi.
- **16 Ekim, akşam:** Plan SİCİL olarak kesinleşti (ekip planı 2. sürüm). KUYRUK, SPK kaldıraç yasağı nedeniyle düştü.
