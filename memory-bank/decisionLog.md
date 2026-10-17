# Decision Log

> Alınmış kararlar ve gerekçeleri. Yapay zekâ bu kararları yeniden tartışmaya açmaz; değişiklik gerekiyorsa insana sorar ve onay gelirse **yeni** bir kayıt ekler.

## K-01 · Proje: SİCİL (16 Ekim)

**Karar:** SİCİL ile yarışıyoruz; B planı ANAYASA.
**Gerekçe:**
- Jürinin iki yarısına da hitap ediyor: OKX TR için gerçek, yerel bir kullanıcı acısı (sahte sinyal grupları) ve "OKX TR Ajan Pazarı" ürün vizyonu; Team1 için zincirin ürünün kendisi olması ve ERC-8004'ün üç kaydının derin kullanımı.
- Sahne anı (canlı yakalama) piyasa hareketine bağlı değil, kontrol bizde.
- "Zincire kayıt" kalabalığından ayrışıyor: kayıt işlemden **önce** ve **eksiksiz**.
**Değerlendirilip elenenler:** aşağıdaki K-02 ve K-03.

## K-02 · KUYRUK elendi (16 Ekim)

**KUYRUK:** Kaldıraçlı pozisyonu likidasyondan otonom kurtaran nöbetçi ajan (OKX AI松 hackathonunda iki kez ödül alıp kodlanmamış 断尾求生 / Sacrifice Protocol fikri).
**Neden elendi:** SPK düzenlemesiyle Türkiye'de faaliyet gösteren kripto platformlarında kaldıraç, türev, kredili alım ve açığa satış yasak. OKX TR ana sayfası yalnızca spot ve TRY ürünlerinden söz ediyor. KUYRUK'un çekirdeği TR hesabında büyük ihtimalle çalışmaz; OKX TR jürisi de bunu kendi kullanıcısına sunamaz.
**Kaynaklar:** [Webtekno](https://www.webtekno.com/kripto-kaldiracli-islemler-yasaklaniyor-h154886.html), [CNN Türk](https://www.cnnturk.com/ekonomi/kripto-varliklara-yeni-duzenleme-spkdan-kripto-platformlarina-sermaye-ve-guvenlik-sarti-2254716), [OKX TR](https://tr.okx.com/).
**Ondan taşınanlar:** "47 emir, 47 kayıt" doğrulayıcı fikri (artık ürünün kendisi), jüri freni, Türkçe kuralın zincirde limite dönüşmesi, ATK yürütücüsü.

## K-03 · ANAYASA ana proje değil, B planı (16 Ekim)

**ANAYASA:** Türkçe kural → zincirde politika kontratı → her emir öncesi zincir onayı + jüri freni.
**Neden ana proje değil:** En kolay yapılan ama en kalabalık fikir. Başlangıç dokümanı ("Yeminli Agent"), aynı gün yayımlanan Türkçe ATK rehberi ve jüri üyesi Ömer Aksu'nun atölyesi aynı yöne itiyor; salonda 5–10 benzeri beklenir. Strateji tarafı sığ.
**Neden B planı:** SİCİL ile kodun büyük kısmı ortak; 14:00'te döngü çalışmazsa kayıpsız inilir.

## K-04 · Sadece spot, OKX TR (16 Ekim)

**Karar:** BTC-USDT, ETH-USDT (BTC-TRY sabah değerlendirilecek). Swap/perp/kaldıraç yok.
**Gerekçe:** K-02'deki yasal çerçeve. Spotta likidasyon olmadığı için küçük bir canlı hesap (Bonus 1) düşük riskli.

## K-05 · Kararı LLM verir, sınırı kural motoru ve kontrat koyar (16 Ekim, plan 2. sürüm)

**Karar:** Kural motoru aday + tavan boyut + zorunlu stop üretir. LLM araştırır ve AL/BEKLE/PAS kararı verir; AL ise yanlışlanabilir tez yazar. LLM boyutu sadece küçültebilir.
**Gerekçe:** İlk sürümde kararı formül veriyordu; jüri "bu bir bot, yapay zekâ nerede?" diyebilirdi (otonomi %35). LLM'e gerçek ama sınırlı bir karar yetkisi verildi; tez + kalibrasyon yapay zekânın kararını ölçülebilir kılıyor.

## K-06 · Denetçide LLM yok (16 Ekim)

**Karar:** Denetçi tamamen kurallı.
**Gerekçe:** "Yapay zekâyı muhakeme gereken yere, kuralı güven gereken yere koyduk." Doğrulamayı herkes tekrarlayabilmeli.

## K-07 · ERC-8004 için resmi Fuji kayıtları (16 Ekim)

**Karar:** Kendi ERC-8004 kontratımızı yazmıyoruz; Fuji'deki Identity, Reputation, Validation kayıtlarını kullanıyoruz.
**Gerekçe:** Hazır ve çalışıyor (16 Ekim'de proxy + implementasyon doğrulandı); Team1 atölyesi de ERC-8004 kullanıyor; zaman kazandırıyor.

## K-08 · Dört ayrı cüzdan (16 Ekim)

**Karar:** Sahip, trader, denetçi, fren ayrı cüzdanlar.
**Gerekçe:** "Kendi notunu kendi veremez" iddiası ancak trader ve denetçi ayrı kimliklerse doğru; ERC-8004 büyük ihtimalle sahibin kendi ajanına not vermesini engelliyor. Fren cüzdanı sadece `pause` yapabilmeli. Hata olursa zarar sınırlı kalır.

## K-09 · Dürüstlük kuralı (16 Ekim)

**Karar:** Eksi getiri de gösterilir. İddia "kâr" değil, "yalan söyleyemeyen sicil". Canlı yakalama ana hesapta yapılır ve kırmızı kalıcıdır.

## K-10 · Plan donduruldu (16 Ekim, gece)

**Karar:** Ekip planının 2. sürümü son karar. Ek düzeltmeler (tez süresi, PAS kayıtları, OCO eşleştirmesi vb.) belgeye eklenmez; uygulama sırasında karşımıza çıktıkça çözülür ve `activeContext.md`'de takip edilir.

## K-11 · Haber modülü yok; LLM araştırması anahtarsız global piyasa verisi (17 Ekim, ~12:15)

**Karar:** `news` modülü şimdilik kaldırıldı. LLM'in araştırma süreci `okx-trade-mcp --profile piyasa --read-only --modules market` (anahtarsız, `site = "global"`). Araçlar: `market_get_funding_rate` (BTC/ETH-USDT-SWAP), `market_get_open_interest`, `market_filter_oi_change`, `market_filter`, `market_get_indicator`.
**Gerekçe:** `news` TR demo modunda tamamen kapalı (doğrulandı); açmak canlı hesapta anahtar gerektiriyor. Funding ve OI için SWAP gerekiyor, TR'de yok; global herkese açık veri anahtarsız çalışıyor (17 Ekim'de beşi de doğrulandı). Yan kazanç: LLM sürecinde hiç anahtar yok.
**Sınır:** Global veri sadece bağlam; emir fiyatı/stop/tavan TR demo verisinden gelir.
**Açık kalan:** Vakit kalırsa canlı TR hesabında sadece Read anahtarla `news` denenecek (seçenek a).

## K-12 · ERC-8004 kimlikleri: trader'ı sahip kaydeder, denetçi kendini (17 Ekim, ~12:25)

**Karar:**
- Trader'ın agentId'sini **sahip cüzdanı** (`0x8394…90A8`) `register(agentURI)` ile kaydeder. `agentURI` JSON'unda trader adresi (`0x7c99…4E07`) yazılır.
- `setAgentWallet` (agentWallet'ı imzalı olarak trader'a bağlamak) **şimdi yapılmaz**; vakit kalırsa en sona, en fazla 20 dakika.
- **Denetçi** kendi cüzdanıyla (`0x9632…3D02`) kendini kaydeder. Denetçi **hiçbir zaman** sahibin operatörü yapılmaz (`approve` / `setApprovalForAll` yok): kontrattaki `Self-feedback not allowed` kontrolü ancak böyle anlamlı kalır.
- Saatlik `validationRequest`'i **sahip** çağırır; `validationResponse`'u denetçi verir.

**Gerekçe:** Identity kaydında sahibin bütün ajanları `balanceOf(sahip)` ile görünür; demoScript'teki "10 hesap" cevabı ("Identity Registry sahibin bütün ajanlarını gösteriyor, bu kısmi bir cevap") bu kararla doğru kalır.
**Bedel:** Kayıttan otomatik gelen `agentWallet` sahip adresi olur; trader bağlantısı `setAgentWallet` yapılana kadar sadece agentURI JSON'unda (imzasız beyan) durur. Sunumda bu dürüstçe söylenir.

## K-13 · SicilKasasi ayrıntıları (17 Ekim, ~12:45)

**Karar:**
1. `setSicilBaslangic()` parametre almaz, `block.timestamp` yazar; sadece sahip, sadece bir kez (geriye tarih atılamaz).
2. `attest` günlük sonucu **işaretli USDT cent** (`int256 dayPnlCent`) alır; "gün" = `sicilBaslangic`'ten beri. Baz puan rapor JSON'unda kalır. Limit 50 USDT (`-5000` ve altı → otomatik fren).
3. **Tutar tutarlılığı:** `reveal`'de `priceE8 × sizeE8`, mühürdeki `notionalCent`'i 1 cent yuvarlama payından fazla aşarsa reddedilir. Denetçi de OKX'teki gerçek dolum tutarı mühürdeki tutarı aşan emri **eşleşmemiş** sayar.
4. `seal` `pair`'i string alır, izin için kontrat içinde hash'ler, `Sealed`'da düz metin yayınlar. Zincir dışı hash (viem) ile kontrat hash'inin aynı olduğu Foundry'de `ffi` ile kanıtlandı.
5. İzinli pariteler sadece BTC-USDT ve ETH-USDT.
6. Açıklama penceresi 3 saat: pencere içinde açıklanmayan mühür "tutmadı"; kontrat geç `reveal`'i reddeder (planda süre tanımsızdı: tez süresi hash'te gizli olduğu için denetçi açıklanmamış mührün süresini bilemezdi).
Limitler: 20 USDT/işlem, 50 USDT/gün, 300 sn bekleme.

**Uygulama notları (Claude):** constructor denetçinin trader veya sahip olmasını reddeder (K-08/K-12 ile tutarlı); `reveal` durdurulmuş kontratta da çalışır (dürüstlük); `Revealed` olayı salt'ı da yayınlar (herkes hash'i yeniden hesaplayabilsin); `via_ir = true` (reveal'in 8 parametresi stack too deep veriyordu).
**Gerekçe:** Mühürde küçük tutar gösterip büyük emir açmanın ve geriye tarihli sicil başlatmanın yolunu kapatmak; zarar limitinin kontratta gerçekten karşılaştırılabilmesi.

---

## Araştırma özeti (kararların arka planı)

**OKX AI松 2. dönem (Mart–Nisan 2026, ATK temalı):** Puanlama: ATK entegrasyonu %30 + fayda %30 + yenilik %20 + tekrarlanabilirlik %20. Kazananlar:
- 1. "Dinamik Grid Yöneticisi" (kod yok, prompt olarak yayımlanmış)
- 2.ler: [GeneFi](https://github.com/Brian5216/GeneFi) (genetik evrim), [NashGuard](https://github.com/wy51ai/nashguard) (imza kapılı risk sandbox'ı), AI War Room (çok-agent'lı harekât odası)
- Yaratıcı kulvar: 弃车保帅 / Sacrifice Protocol ve 极端行情断尾求生引擎 (kodsuz fikirler)
- Duyuru: https://x.com/okxchinese/status/2039593807210258786

**OKX TR Agentic Trading Hackathon, İstanbul (12 Eylül 2026):** Aynı format (1 gün, ATK zorunlu, jüri). 1.: derin piyasa yapısı stratejisi; 2.: çok-agent'lı "hedge fon konseyi"; 3.: AEGIS (Türkçe risk mentoru). OKX TR jürisi **strateji derinliği** ve ürünün "önü ve arkası"nı istedi; ilk commit'in gün içinde atılması kuralı vardı. Yayın: https://www.youtube.com/watch?v=KFzUGf3_SRg

**Team1 / Ömer Aksu atölyesi:** "Off-chain karar veren ajan, on-chain sınır koyan kontrat"; AgentAccount, WorkshopHub, ERC-8004. https://github.com/omeraksu/autonomy-workshop (lisanssız: kod kopyalanmaz, atıf yapılır).

**Ortak dersler:** Risk sistemi ürünün merkezinde; LLM yürütme yolunun dışında; kapalı otonom döngü; açık kod ve tekrarlanabilirlik; güçlü bir metafor; demo hesapta gerçek emir numarası gibi somut kanıtlar.

**Lisans notu:** NashGuard, GeneFi ve Ömer Aksu'nun reposu lisanssız; kodları kopyalanamaz. Sadece fikir ve mimari ilham olarak, atıfla anılır.
