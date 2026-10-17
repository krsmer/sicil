# Demo Script: 10 dakikalık sunum

> İlke: **Kanıtı olmayan iddia sunuma girmez.** Her adımın 17:30'da çekilmiş yedek videosu hazır olacak. İstanbul hackathonunda 2 dakikalık bir format da vardı; kısa sürümü de prova edin.

## İlk 60 saniye (ezberlenecek)

> "Telegram'da bir sinyal grubu size bu ekran görüntüsünü atıyor: yüzde 300 kâr. Doğru mu? Bilemezsiniz. Zincire yazmış olsa da bilemezsiniz, çünkü sadece kazandıranları yazabilir. SİCİL'de yapay zekâ kararını işlemden önce mühürlüyor. Bağımsız bir denetçi hesabın tamamını tarıyor. Tek bir işlem gizlenirse sicil kalıcı olarak kırmızıya dönüyor. Şimdi bunu deneyeceğiz."

Neden ilk dakika bu kadar önemli: Jüri ilk dakikada "bir zincire kayıt projesi daha" diye düşünmeye başlarsa bu izlenimi geri çevirmek zor olur. Fark ilk 60 saniyede söylenir, kanıtı 2. dakikada canlı gelir.

## Akış

| Zaman | Bölüm | Ekranda | Söylenecek / yapılacak |
|---|---|---|---|
| 0:00–1:00 | Sorun ve fark | "Örnek" etiketli sahte sinyal ekran görüntüsü; arkada "zincire kayıt vs sicil" karşılaştırma slaytı | Yukarıdaki metin |
| 1:00–1:45 | Temiz sicil | Panel: 12:30'dan beri işlem sayısı, mühür sayısı, net getiri | Bir mühüre tıkla: Snowtrace'teki zaman damgası OKX'teki emir saatinden **önce** |
| 1:45–3:00 | **Canlı yakalama** | Panel + OKX TR uygulaması | Sunucu uygulamadan elle, mühürsüz küçük bir işlem yapar: "Dolandırıcı tam olarak bunu yapar." Denetçi (sunum sırasında 15 sn'de bir tarar) yakalar; zincire `SicilBozuldu` düşer, panel kırmızıya döner. **"Bu kırmızı artık silinemez. Benim tarafımdan bile."** |
| 3:00–5:00 | Yapay zekânın muhakemesi | Gün içinden bir mühür | LLM'in çağırdığı ATK araçları, kararı, tezi (hedef, geçersizlik, süre, güven). Denetçinin tezi nasıl puanladığı. LLM'in PAS dediği bir aday. Kalibrasyon: "%70 güvendiği tezlerin kaçı tuttu?" |
| 5:00–6:00 | Zincir sınır koyuyor | Gün içinden gerçek bir ret kaydı (Snowtrace'te reverted tx) | "Kural motoru volatiliteye göre 34 USDT hesapladı, kontrat 20 USDT limitinde reddetti, ajan tutarı düşürüp yeniden mühürledi." Ajan, kural motorunun limit üstü ham tutarını **saatte en fazla bir kez** simülasyonsuz olarak zincire sunuyor, zincir reddediyor (reverted tx Snowtrace'te); ajan tutarı limite indirip yeniden mühürlüyor. Gösterilen kayıt günün gerçek kaydı (bugün 13:02: 51,02 USDT → 20 USDT limiti) |
| 6:00–7:00 | **Jüri freni** | Panel | Bir jüri üyesi paneldeki "Freni çek"e basar ve Brave'deki MetaMask penceresinde `pause()` işlemini onaylar. Ajan durur, panelde "durduruldu" |
| 7:00–8:30 | Mimari ve vizyon | Mimari diyagramı (`assets/mimari.png`) | "Yapay zekâyı muhakeme gereken yere, kuralı güven gereken yere koyduk." ERC-8004'ün üç kaydı, "OKX TR Ajan Pazarı" vizyonu |
| 8:30–10:00 | Kapanış | Kanıt ekranı + QR | Ör. "52 emir, 51 mühür, 1 kayıtsız işlem: sahnede yaptığımız." Yanında kalibrasyon özeti. Repo ve Snowtrace için QR kod |

**Kurallar kartı (5:00–6:00 sahnesinin girişi):** Kullanıcının Türkçe kuralındaki üç sayı (sadece BTC ve ETH, işlem başı 20 USDT, günde en fazla 50 USDT zarar) kasanın kurulum işleminde ([deploy tx `0x75eeb4ca…b0c`](https://testnet.snowtrace.io/tx/0x75eeb4ca34f9e39153e4af4c17222fce75255cad96fe12ac3bb31845a3e75b0c)) constructor argümanı olarak `pariteler`, `maxTutarCent = 2000`, `maxGunlukZararCent = 5000` değerleriyle kontrata yazıldı ve `immutable` olduğu için bir daha değiştirilemez; bugün Türkçe cümleyi sayılara ekip çevirdi, ürün akışında bunu LLM yapıp kullanıcıya onay kartıyla gösterecek (dürüstçe söyle).

**"Kuralını yaz" gösterimi (kurallar kartından hemen sonra, ~30 sn):** Panelde jüriden bir kural iste (ör. "Sadece ETH, işlem başı 10 USDT, günde en fazla 30 USDT zarar"); yapay zekâ (Gemini, sunucuda) cümleyi sayılara çevirir, **kabul/ret kararını kod verir** (pariteler BTC/ETH, işlem başı 5–50, günlük zarar 10–200 ve ≥ işlem başı), onay kartında constructor argümanları görünür. Kartta "GÖSTERİM" yazar: gerçek kontrat kurulmaz. Kaldıraçlı ya da aralık dışı bir kural da dene; ret nedenleri listelenir.

**Vizyon (bugün yapılmadı, açıkça söyle):** Ürün akışında onaylanan her kural için kullanıcıya **kendi kasası** kurulur: yeni bir `SicilKasasi`, kullanıcının limitleriyle, değiştirilemez. "Kuralı kullanıcı koyar, ama bir kez koyar; sonradan değiştirilebilseydi sicil yalan söyleyebilirdi." Bugün tek kasa var; gösterim ekranı gerçek kurulum yapmıyor.

**Alternatif:** Ana ajanın sicilinin temiz kalması istenirse canlı yakalama ikinci bir hesapta yapılır (ayrı API anahtarı + ayrı agentId). Zaman kalırsa. Varsayılan plan ana hesap: kalıcı kırmızı, iddianın en güçlü kanıtı.

**Yedek:** TR demo'da uygulamadan elle işlem yapılamıyorsa, mühür atmadan emir gönderen küçük bir script aynı etkiyi verir ("dolandırıcı script'i").

## Sahne hazırlığı

- [ ] Panel ve Snowtrace sekmeleri önceden açık
- [ ] Jüri freni: Brave'de panel açık, MetaMask kilidi açık, Account 1 (fren) seçili, Avalanche Fuji ağı ekli; Brave Wallet varsayılan cüzdan değil (Ayarlar → Web3 → Varsayılan Ethereum cüzdanı: MetaMask / uzantılar)
- [ ] Yedek RPC tanımlı, telefon hotspot'u hazır
- [ ] Her bölümün yedek videosu (17:30 çekimi) sunum bilgisayarında
- [ ] Sahte sinyal görselinde "örnek" etiketi görünür

## Jüri soruları ve hazır cevaplar

En tehlikeli sorular ilk ikisi; cevaplarını her ekip üyesi ezbere bilmeli.

| Soru | Cevap |
|---|---|
| **Bu bir bot, yapay zekâ ajanı nerede?** | Kararı LLM veriyor. Kural motoru sadece aday üretiyor ve tavan koyuyor. Hangi kurulumun işleme değdiğine, nasıl araştırma yapacağına ve ne kadar güveneceğine LLM karar veriyor. Sicile yazılan şey yapay zekânın tezi. |
| **Zincire kayıt yapan çok proje var, sizin farkınız ne?** | Biz kaydı işlemden önce yapıyoruz. Sonradan yapılan kayıt seçilerek yapılabilir, bizimki yapılamaz. Bütün kaydın eksiksiz olduğunu bağımsız bir denetçi kanıtlıyor, notu da ajanın kendisi vermiyor. |
| Kontrat emri engellemiyor, neyi garanti ediyor? | Doğru, emri yürütücü gönderiyor. Kontrat "yapamazsın" demiyor, "yaparsan herkes görür" diyor. Mühürsüz tek emir sicili kalıcı olarak bozuyor. Limit aşımları ise mühür anında reddediliyor. |
| Denetçi de sizin kodunuz, ona neden güveneyim? | Denetçi açık kaynak, sadece okuma anahtarıyla çalışıyor ve bilerek LLM kullanmıyor. Aynı anahtarı ve zinciri kullanan herkes aynı sonuca ulaşır. ERC-8004 Validation birden fazla doğrulayıcıyı destekliyor. Ürün vizyonunda doğrulayıcı OKX TR'nin kendisi. |
| LLM yanlış karar verirse ne olur? | LLM sınırları aşamaz. Boyutu sadece küçültebilir, stop olmadan emir çıkmaz, tutarı kontrat keser. LLM'in bağlandığı ATK sürecinde yazma aracı hiç yok (`--read-only`). Kötü kararları sicilde ve kalibrasyon notunda görünür, saklanamaz. |
| Biri 10 hesap açıp sadece en iyisini gösterirse? | Identity Registry sahibin bütün ajanlarını gösteriyor, bu kısmi bir cevap. Tam çözüm, borsanın kimliği doğrulanmış hesabı agentId'ye bağlaması. Bunu açık nokta olarak dürüstçe söylüyoruz. |
| Hash'i işlemden önce zincire yazmak gecikme yaratmıyor mu? | Fuji'de onay birkaç saniye sürüyor (sabah ölçülen değeri söyle). Strateji saatlik mumlarla çalıştığı için bu gecikmenin önemi yok. |
| Strateji para kazandırıyor mu? | İddiamız kâr değil, dürüst sicil. Bugünkü net getiri ve kalibrasyon bu, eksiyse eksi. Emirlerimiz maker (`post_only`); OKX TR canlıda maker ücretinin sıfır olduğunu söylüyor, bugünkü demo hesapta ise %0,08 ödedik. Sicile her işlemin gerçek ücreti yazılıyor, getiri net. |
| Neden kaldıraçlı işlem yok? | SPK'nın düzenlemesiyle Türkiye'de faaliyet gösteren platformlar kaldıraç sunamıyor. OKX TR'nin kullanıcısına bugün sunabileceği ürün spot. |
| Neden Avalanche? | Onay hızlı ve ücret düşük; saatte onlarca mühür mümkün. ERC-8004'ün üç kaydı Fuji'de hazır duruyor. Fren MetaMask gibi standart bir EVM cüzdanından tek işlemle çekiliyor. |
| PAS dediği adayı sonradan seçmediğinizi nereden bileceğiz? | (Hazırlıklı ol.) PAS kararları zincire mühürlendiyse: "Onlar da mühürlü." Mühürlenmediyse dürüst ol: "PAS kayıtları şu an yerel log'da; bir sonraki adım onları da mühürlemek." |

## Atıflar (sunumda tek cümle)

"Team1 atölyesindeki 'ajan karar verir, zincir sınır koyar' fikrinden ve ERC-8004 kayıtlarından yararlandık; sicil ve bağımsız denetçi kısmını üstüne inşa ettik."
