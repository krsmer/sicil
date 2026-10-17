# Demo Script: 3–4 dakikalık sunum (7 bölüm)

> İlke: **Kanıtı olmayan iddia sunuma girmez.** Sunum panelin kendisi: http://127.0.0.1:8787. **S** tuşu sunum modunu açar (menü gizlenir, yazı büyür); **→ / boşluk / Page Down** sonraki bölüm, **← / Page Up** önceki. Sağ üstte "3 / 7 · Canlı sicil" ilerlemesi, her bölümün sağ üst köşesinde jüri kriteri etiketi, altta canlı kanıt şeridi (kasa · son mühür · son denetim · ERC-8004 notu). Vizyon olan her şey sayfada **VİZYON** etiketli; söylerken de "vizyon" de.

## Akış

| Zaman | Bölüm (kriter) | Söylenecek (1–2 cümle) | Tıklanacak yer |
|---|---|---|---|
| 0:00–0:20 | **1 · Giriş** (Innovation) | "Türkiye'de bir işe girerken sizden istenen ilk belgelerden biri adli sicil kaydıdır. Bugün paramızı yapay zekâ ajanlarına emanet ediyoruz, ama kimse onların sicilini sormuyor. SİCİL'i bunun için yaptık." | Canlı rozeti göster: SİCİL TEMİZ, mühür sayısı, mühürsüz 0; alttaki "13:01'den beri insansız çalışıyor" |
| 0:20–0:45 | **2 · Sorun ve kullanıcı** (Innovation: problem, kullanıcı) | "Sinyal gruplarının kâr ekranı düzenlenebilir; işlemi sonradan zincire yazmak da sadece seçilenleri kanıtlar. Biz kaydı işlemden önce yapıyoruz ve bağımsız bir denetçi hepsini sayıyor." Kullanıcılar: takip etmek isteyen yatırımcı, başarısını kanıtlamak isteyen geliştirici | "Zincire kayıt vs SİCİL" tablosunun son satırı: **hiçbir işlemin gizlenmediğini** |
| 0:45–1:40 | **3 · Canlı sicil** (Agentic Design · Technical Execution · Demo) | "Ajan bugün 13:01'den beri insansız çalışıyor. Son kayıt: yapay zekâ kendi seçtiği 4 OKX aracıyla araştırdı, AL dedi, kararı emirden X saniye önce mühürlendi, denetçi eşledi." Tezi düz cümlesiyle oku | En yeni sicil kartı (açık gelir): 4 adım şeridi → "emirden X sn önce" → tez cümlesi → fiyat çubuğu → **araç zinciri** (1–4 numaralı ATK araçları). İstersen "mühür ↗" ile Snowtrace |
| 1:40–2:10 | **4 · Canlı deney** (Demo · Avalanche) | "Freni siz çekin." Jüri üyesi "Freni çek" → MetaMask'te `pause()` onayı → panelde AJAN DURDURULDU (2 sn içinde). Sonra: "Kontratı kandırmayı deneyelim." | **Freni çek** · ardından "Dört denemeyi çalıştır" (4 ret, Türkçe nedenleriyle) ya da "Doğrula" (hash eşleşir) |
| 2:10–2:40 | **5 · Mimari ve entegrasyonlar** (Technical · Avalanche · OKX) | "İki ajan birbirine sadece zincir üzerinden güveniyor. Mühür Avalanche'ta ~1–2 sn'de kesinleşiyor ve maliyeti pratikte sıfır; o yüzden her emirden önce mühür atabiliyoruz. LLM'in bağlandığı ATK sürecinde yazma aracı hiç yok." | "Neden Avalanche?" kartındaki canlı ölçümler (mühür → emir sn, blok süresi, mühür maliyeti) · "Teknik zorluk" 3 madde · 29 + 33 test |
| 2:40–3:30 | **6 · İş modeli ve OKX.AI** (Innovation: iş modeli, pazar · OKX.AI) | "OKX TR kaldıraçlı copy-trading sunamıyor ama sicili doğrulanmış spot ajanlar sunabilir. SİCİL bir servis: agentId verin, sicili dönsün; bu JSON şu an canlı." Gelir modeli ve OKX.AI listelemesi **vizyon** | Ortadaki canlı JSON (`GET /api/sicil/258`): sicil, mühür, mühürsüz 0, net getiri, Brier, son denetim tx |
| 3:30–4:00 | **7 · Kapanış** (Demo) | "Kaybettiği günleri bile saklayamayan bir yapay zekâ trader'ı. Bu tablodaki her satır tıklanabilir bir kanıt." | Kriter → kanıt tablosu; repo linki |

**Prova notları**
- Fren sahnesinden sonra kasayı **sahip** açar (terminal, `cast send … "unpause()" --account sicil-sahip …`); fren hesabı açamaz (bu bilinçli: "durdurmak kolay, başlatmak sadece sahipte").
- Kasa zaten durdurulmuşsa fren düğmesi pasif olur: önceden `unpause` et ya da 4. bölümde "kontratı kandır" ile devam et.
- `?onizleme=bozuk` ve `?onizleme=durdu` sadece arayüzü değiştirir (sarı ÖNİZLEME şeridi, zincire yazma yok); prova için.
- "Kuralını yaz" (4. bölüm, istenirse): jüriden bir kural al; yapay zekâ sayılara çevirir, kabul/ret kararını kod verir; kartta GÖSTERİM yazar, gerçek kasa kurulmaz. Vizyon: onaylanan her kurala kullanıcının **kendi kasası** kurulur ("kuralı kullanıcı koyar, ama bir kez koyar").
- Sayılar canlı: "X sn", "Y mühür" gibi değerleri sunum anında ekrandan oku, ezberden söyleme.

## Soru-cevap (5 olası soru)

| Soru | Kısa cevap |
|---|---|
| **Bu bir bot değil mi?** | Kural motoru sadece aday ve tavan üretiyor. İşleme değip değmediğine, hangi OKX araçlarıyla araştıracağına ve ne kadar güveneceğine LLM karar veriyor; PAS ya da BEKLE diyebiliyor. Kartta araç zinciri ve tez görünüyor; tezin isabetini Brier skoru ölçüyor. |
| **Kontrat emri engelliyor mu?** | Hayır, para OKX'te; emri yürütücü gönderiyor. Kontrat iki şey yapıyor: limit aşan mührü reddediyor (zincirde reverted tx) ve mühürsüz tek emri sicile kalıcı "bozuk" olarak yazdırıyor. "Yapamazsın" değil, "yaparsan herkes görür." |
| **Denetçiye neden güvenelim?** | LLM kullanmıyor, sadece okuma anahtarıyla çalışıyor, kodu açık; aynı anahtar ve zincirle herkes aynı sonucu bulur. Rapor JSON'u repoda, hash'i zincirde. ERC-8004 birden çok doğrulayıcıyı destekliyor; vizyonda doğrulayıcı OKX TR'nin kendisi. |
| **İş modeli ne?** | Vizyon: geliştiricilere doğrulanmış sicil aboneliği, sicil sorgusu başına x402 mikroödeme, OKX TR için sicili doğrulanmış spot ajan pazarı. Bugün çalışan kısım: sicil servisi (`/api/sicil/258`) ve tek deploy'la kurulan kasa. Gelir rakamı iddia etmiyoruz. |
| **Neden Avalanche?** | Mühür emirden önce kesinleşmeli: Fuji'de blok ~1–2 sn, mühür → emir arası ölçülen birkaç saniye; mühür maliyeti pratikte sıfır, her emre mühür atabiliyoruz. ERC-8004 kayıtları Fuji'de hazır. Vizyon: borsalar için özel L1 ve ICM ile diğer zincirlerin sicili okuması. |

## Ek sorular (eski hazırlık, hâlâ geçerli)

| Soru | Cevap |
|---|---|
| **Bu bir bot, yapay zekâ ajanı nerede?** | Kararı LLM veriyor. Kural motoru sadece aday üretiyor ve tavan koyuyor. Hangi kurulumun işleme değdiğine, nasıl araştırma yapacağına ve ne kadar güveneceğine LLM karar veriyor. Sicile yazılan şey yapay zekânın tezi. |
| **Zincire kayıt yapan çok proje var, sizin farkınız ne?** | Biz kaydı işlemden önce yapıyoruz. Sonradan yapılan kayıt seçilerek yapılabilir, bizimki yapılamaz. Bütün kaydın eksiksiz olduğunu bağımsız bir denetçi kanıtlıyor, notu da ajanın kendisi vermiyor. |
| Kontrat emri engellemiyor, neyi garanti ediyor? | Doğru, emri yürütücü gönderiyor. Kontrat "yapamazsın" demiyor, "yaparsan herkes görür" diyor. Mühürsüz tek emir sicili kalıcı olarak bozuyor. Limit aşımları ise mühür anında reddediliyor. |
| Denetçi de sizin kodunuz, ona neden güveneyim? | Denetçi açık kaynak, sadece okuma anahtarıyla çalışıyor ve bilerek LLM kullanmıyor. Aynı anahtarı ve zinciri kullanan herkes aynı sonuca ulaşır. ERC-8004 Validation birden fazla doğrulayıcıyı destekliyor. Ürün vizyonunda doğrulayıcı OKX TR'nin kendisi. |
| LLM yanlış karar verirse ne olur? | LLM sınırları aşamaz. Boyutu sadece küçültebilir, stop olmadan emir çıkmaz, tutarı kontrat keser. LLM'in bağlandığı ATK sürecinde yazma aracı hiç yok (`--read-only`). Kötü kararları sicilde ve kalibrasyon notunda görünür, saklanamaz. |
| Biri 10 hesap açıp sadece en iyisini gösterirse? | Identity Registry sahibin bütün ajanlarını gösteriyor, bu kısmi bir cevap. Tam çözüm, borsanın kimliği doğrulanmış hesabı agentId'ye bağlaması. Bunu açık nokta olarak dürüstçe söylüyoruz. |
| Hash'i işlemden önce zincire yazmak gecikme yaratmıyor mu? | Fuji'de mühür bloğundan OKX emrine ölçülen süre birkaç saniye (panelde canlı, 5. bölüm). Strateji 15 dk/1 saatlik mumlarla çalıştığı için önemsiz. |
| Strateji para kazandırıyor mu? | İddiamız kâr değil, dürüst sicil. Bugünkü net getiri ve kalibrasyon bu, eksiyse eksi. Emirlerimiz maker (`post_only`); OKX TR canlıda maker ücretinin sıfır olduğunu söylüyor, bugünkü demo hesapta ise %0,08 ödedik. Sicile her işlemin gerçek ücreti yazılıyor, getiri net. |
| Neden kaldıraçlı işlem yok? | SPK'nın düzenlemesiyle Türkiye'de faaliyet gösteren platformlar kaldıraç sunamıyor. OKX TR'nin kullanıcısına bugün sunabileceği ürün spot. |
| Neden Avalanche? | Onay hızlı ve ücret düşük; saatte onlarca mühür mümkün. ERC-8004'ün üç kaydı Fuji'de hazır duruyor. Fren MetaMask gibi standart bir EVM cüzdanından tek işlemle çekiliyor. |
| PAS dediği adayı sonradan seçmediğinizi nereden bileceğiz? | (Hazırlıklı ol.) PAS kararları zincire mühürlendiyse: "Onlar da mühürlü." Mühürlenmediyse dürüst ol: "PAS kayıtları şu an yerel log'da; bir sonraki adım onları da mühürlemek." |


## Sahne hazırlığı

- [ ] Panel ve Snowtrace sekmeleri önceden açık
- [ ] Jüri freni: Brave'de panel açık, MetaMask kilidi açık, Account 1 (fren) seçili, Avalanche Fuji ağı ekli; Brave Wallet varsayılan cüzdan değil (Ayarlar → Web3 → Varsayılan Ethereum cüzdanı: MetaMask / uzantılar)
- [ ] Yedek RPC tanımlı, telefon hotspot'u hazır
- [ ] Her bölümün yedek videosu (17:30 çekimi) sunum bilgisayarında
- [ ] Sahte sinyal görselinde "örnek" etiketi görünür

## Atıflar (sunumda tek cümle)

"Team1 atölyesindeki 'ajan karar verir, zincir sınır koyar' fikrinden ve ERC-8004 kayıtlarından yararlandık; sicil ve bağımsız denetçi kısmını üstüne inşa ettik."
