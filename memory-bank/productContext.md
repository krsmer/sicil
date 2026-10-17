# Product Context: SİCİL

## Sorun

Türkiye'de bir trader'ın ya da bir yapay zekâ ajanının geçmişini doğrulamanın yolu yok.

- Telegram'daki "VIP sinyal grupları" kâr ekran görüntüsü paylaşıyor. Ekran görüntüsü düzenlenebilir.
- Kaybettiren işlemler gizlenebilir; sadece kazandıranlar gösterilir.
- Backtest geriye dönük ayarlanabilir.
- Yapay zekâ ajanları çoğaldıkça aynı soru onlar için de soruluyor: **"Bu ajanın kâr ettiğini nereden bileceğim?"**

İşlemleri "sonradan zincire yazmak" bunu çözmüyor: yazılanın değişmediğini kanıtlar ama **yazılmayanı göstermez**. Sadece kazandıranlar yazılabilir.

## SİCİL'in cevabı: üç kural

1. **Mühürsüz işlem yok.** Ajan her emirden önce kararının hash'ini zincire yazar. Emrin OKX'teki etiketi (`clOrdId`) mühür numarasıdır.
2. **Seçerek gösterme yok.** Denetçi ajan hesabın **bütün** işlemlerini OKX'ten çeker. Mühürsüz tek bir işlem bulursa sicili zincirde kalıcı olarak "bozuk" işaretler.
3. **Kendi notunu kendi veremez.** Kâr/zarar ve isabet notunu trader ajan değil, ayrı cüzdanlı denetçi ajan ERC-8004 Reputation kaydına yazar.

## Neden farklı: "zincire kayıt" ile "sicil" aynı şey değil

Salondaki projelerin çoğu "risk kapısı + işlemi sonradan zincire yaz" kalıbında olacak (başlangıç dokümanı, Türkçe ATK rehberi ve Team1 atölyesi bu yöne itiyor).

| | Zincire kayıt (salondaki çoğu proje) | SİCİL |
|---|---|---|
| Kayıt ne zaman yapılıyor | İşlemden sonra | İşlemden **önce**, hash olarak |
| Hangi işlemler yazılıyor | İstenenler | **Hepsi**; denetçi hesabın tamamını tarıyor |
| Notu kim veriyor | Ajanın kendi beyanı | Bağımsız denetçi, ERC-8004 üzerinden |
| Yapay zekânın rolü | Kayıt dışında | Tezi mühürleniyor, isabeti puanlanıyor |
| Neyi kanıtlıyor | Yazılanın değişmediğini | **Hiçbir işlemin gizlenmediğini** |

## Yapay zekânın rolü (bu bir bot değil)

- Kural motoru **aday** üretir ve her adaya tavan boyut + zorunlu stop koyar.
- **"Bu kurulum işleme değer mi?" kararını LLM verir:** AL, BEKLE ya da PAS.
- AL derse **yanlışlanabilir bir tez** yazar: hedef, geçersizlik seviyesi, süre, 0–100 güven. Örnek: *"BTC 4 saat içinde %1,5 yükselir; %0,8 düşüş tezi bozar; güven 65."*
- Tez işlemden önce mühürlenir; süre dolunca denetçi tezi kurallı olarak puanlar.
- Güven puanlarının isabeti **Brier skoru** ile ölçülür ve ayrı bir not olarak zincire yazılır. Sicil hem getiriyi hem de yapay zekânın kendine ne kadar doğru güvendiğini gösterir.
- Sunum cümlesi: *"Yapay zekâyı muhakeme gereken yere, kuralı güven gereken yere koyduk."*

## Kullanıcılar

| Kullanıcı | İhtiyacı | SİCİL ona ne veriyor |
|---|---|---|
| OKX TR kullanıcısı (takipçi) | Bir ajanı/trader'ı takip etmeden önce gerçek geçmişini görmek | Zincirde doğrulanmış sicil: işlem sayısı, mühürlü oranı, net getiri, en büyük düşüş, kalibrasyon |
| Ajan geliştiricisi / trader | Başarısını kanıtlayabilmek | Uydurulamayan, denetçi onaylı bir sicil |
| OKX TR (platform) | Kaldıraçlı copy-trading sunamıyor; güvenilir spot ürünler arıyor | "OKX TR Ajan Pazarı" vizyonu: sicili doğrulanmış spot ajanlar |

## Ürün vizyonu: "OKX TR Ajan Pazarı"

Kullanıcı bir ajanı takip etmeden önce sicilini zincirde görür: kaç işlem yaptığı, kaçının mühürlü olduğu, net getirisi, en büyük düşüşü ve yapay zekâsının kalibrasyonu. OKX TR kaldıraçlı copy-trading sunamıyor (SPK), ama **sicili doğrulanmış spot ajanlar** sunabilir. Uzun vadede doğrulayıcı (validator) OKX TR'nin kendisi olabilir.

## Kullanıcı akışı (demo kapsamı)

1. Kullanıcı kuralını Türkçe yazar: *"Günde en fazla 50 USDT kaybetmek istiyorum, sadece BTC ve ETH, işlem başı 20 USDT."*
2. LLM bunu sayılara çevirir; kullanıcı **onay kartını** görür (insanın tek müdahalesi).
3. SicilKasasi bu değerlerle deploy edilir; değerler **immutable**.
4. Trader ve denetçi ERC-8004'te kimlik (agentId) alır.
5. Ajan otonom çalışır: aday → LLM kararı → mühür → emir → açıklama.
6. Denetçi düzenli tarar, eşleştirir, tezleri puanlar, not yazar.
7. Panel sicili Türkçe gösterir. Fren cüzdanı ajanı her an durdurabilir.

## Strateji (OKX TR jürisinin "yapının derininde ne var" sorusuna cevap)

- **Pariteler:** BTC-USDT, ETH-USDT. TRY paritelerinin derinliğine sabah bakılır; kayma kabul edilebilirse BTC-TRY eklenir.
- **Rejim:** Saatlik mumlarda trend gücü (EMA eğimi veya ADX) ve ATR. Trend varsa kırılım, yataysa ortalamaya dönüş adayı.
- **Yürütme:** `post_only` limit emir (maker). OKX TR canlıda maker ücretinin sıfır olduğunu duyuruyor (bunu canlı hesapta kendimiz ölçmedik); **demo hesapta maker %0,08, taker %0,10** (17 Ekim, `account_get_trade_fee`). Sicile her zaman OKX'in yazdığı **gerçek ücret** girer; getiri net hesaplanır. Belli sürede dolmayan emir iptal edilir. Her emrin ücreti ve kayması sicile yazılır, getiri **net** hesaplanır.
- **Boyut:** Volatiliteye göre (risk bütçesi / ATR). Kontrat limiti aşılırsa reddeder, ajan tutarı yeniden hesaplar.
- **Çıkış:** `spot_place_algo_order` ile OCO (kâr al + zarar durdur), seviyeler ATR katları.
- **LLM yanıt vermezse:** karar BEKLE, yeni işlem açılmaz; açık pozisyonların OCO emirleri borsada durduğu için korunur.

## Neyi iddia etmiyoruz

- "Ajanımız kâr eder" demiyoruz. "Ajanımızın sicili yalan söyleyemez" diyoruz. Eksi bir gün bu iddiayı sahnede kanıtlar.
- Kontrat emri fiziksel olarak engellemiyor (para OKX'te). Kontrat "yapamazsın" değil, **"yaparsan herkes görür"** diyor; limit aşımlarını ise mühür anında reddediyor.
- "10 hesap açıp en iyisini gösterme" sorununa kısmi cevabımız var (Identity Registry sahibin bütün ajanlarını gösterir); tam çözüm borsanın kimliği doğrulanmış hesabı agentId'ye bağlaması. Bunu açık nokta olarak dürüstçe söylüyoruz.
