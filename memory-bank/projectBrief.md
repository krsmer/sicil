# Project Brief: SİCİL

> Son güncelleme: 16 Ekim 2026, gece (hackathon'dan önceki akşam). Kaynak: ekip planı "SİCİL — Yarışma Planı" (@tarzly, 2. sürüm) + araştırma oturumu.

## Tek cümle

**SİCİL**, OKX TR'de spot işlem yapan otonom bir yapay zekâ ajanı. Her emirden önce yapay zekânın kararını ve tezini Avalanche'a mühürlüyor. Bağımsız bir denetçi ajan hesabın bütün işlemlerini zincirdeki mühürlerle karşılaştırıyor. Sonuç: **uydurulamayan ve geriye dönük değiştirilemeyen bir işlem sicili.**

Açılış cümlesi: *"Herkes size backtest gösterir. Backtest uydurulabilir. Biz size uydurulamayan 7 saati gösteriyoruz."*

## Hackathon

| | |
|---|---|
| Etkinlik | Agentic Hackathon, OKX TR × Team1 Türkiye, ekosistem ortağı Avalanche |
| Tarih / yer | **17 Ekim 2026**, THK Orion Tekmer, Söğütözü, Ankara |
| Geliştirme süresi | 10:00–19:00 (~9 saat). 19:00 teslim, 20:00'de ilk 10 proje 10'ar dakika sunum, 21:45 ödül töreni |
| Ödüller | 1. $1.500 · 2. $1.000 · 3. $500 |
| Zorunlu görev | OKX **Agent Trade Kit (ATK)** ile çalışan **otonom** bir AI agent |
| Bonus 1 | ATK ile gerçek piyasa koşullarında test edilen trading agent |
| Bonus 2 | Agent/ürünü **Avalanche** üzerinde deploy etmek |
| Puanlama | Agent mimarisi ve otonomi **%35** · Ürün ve strateji %25 · Teknik kalite %20 · Demo ve sunum %20 · Bonuslar ekstra |
| Jüri | Ahmet Ramazan Ağırtaş (Ayware), Hüseyin Berk Vardarbaşı ve Burak Yüksel (OKX TR), İbrahim Okan Sarıırmak (Clarion Labs), Ömer Aksu ve Ulaş Yıldız (Team1 Türkiye) |

Jürinin iki ağırlık merkezi var: **OKX TR** (strateji derinliği, ATK'nin derin kullanımı, kendi kullanıcısına sunulabilir ürün) ve **Team1/Avalanche** (zincirin gerçekten iş yapması, ERC-8004, Ömer Aksu'nun "karar off-chain, sınır on-chain" tezi).

## Ne inşa ediyoruz (kapsam)

**Kapsam içinde:**
- **Trader ajan:** Kural motoru aday üretir; LLM araştırır ve AL / BEKLE / PAS kararı verir; AL ise yanlışlanabilir bir tez yazar. Karar mühürlenir, emir OKX TR spota gider, sonra açıklanır.
- **Denetçi ajan:** LLM kullanmaz. Hesabın bütün dolan işlemlerini OKX'ten çeker, mühürlerle eşleştirir, tezleri puanlar, sonucu zincire ve ERC-8004'e yazar.
- **SicilKasasi kontratı** (Avalanche Fuji): mühür, açıklama, denetim raporu, fren.
- **ERC-8004 resmi kayıtları** (Fuji'de hazır): Identity, Reputation, Validation.
- **Türkçe panel:** sicil durumu, mühürler, tezler, kalibrasyon, Snowtrace linkleri, fren durumu.
- **Türkçe kural → kontrat limitleri:** Kullanıcı kuralını Türkçe yazar, LLM sayıya çevirir, onay kartından sonra kontrat bu değerlerle deploy edilir.

**Kapsam dışında:**
- Kaldıraç, vadeli işlem, swap/perp (SPK yasağı, bkz. `decisionLog.md`).
- Para çekme, transfer, Earn (Earn demo modda desteklenmiyor).
- Kendi ERC-8004 kontratımızı yazmak (resmi kayıtları kullanıyoruz).
- x402 aboneliği (ancak her şey biterse).

## Değişmez kurallar

1. **Mühürsüz emir yok.** Hiçbir emir, `Sealed` olayı zincirde onaylanmadan OKX'e gitmez. Emrin `clOrdId` alanı mühür numarasıdır.
2. **LLM'in emir yetkisi yok.** LLM sadece okuma araçlarına erişir; emir aracını yalnızca yürütücü kod çağırır. LLM boyutu sadece küçültebilir, büyütemez. Stop olmadan emir çıkmaz.
3. **Denetçi tamamen kurallı.** Denetçide LLM yok; sonucu herkes tekrarlayabilmeli.
4. **Kendi notunu kendi veremez.** Trader'a notu her zaman denetçi cüzdanı verir.
5. **Dürüstlük.** Getiri eksi çıkarsa gösterilir. İddia "ajanımız kâr eder" değil, "ajanımızın sicili yalan söyleyemez".
6. **Önce demo.** Para hareket ettiren her çağrı demo profilinde çalışır; canlı hesaba insan açıkça karar vermeden geçilmez.
7. **Gizli bilgi repoya girmez.** OKX anahtarları `~/.okx/config.toml`, cüzdanlar `~/.foundry/keystores/` içinde kalır.
8. **Avalanche Solidity:** `evm_version = "cancun"`.

## Başarı ölçütleri (19:00 itibarıyla)

- [ ] Trader ajan 12:30'dan beri insansız çalışıyor; mühür → emir → açıklama döngüsü uçtan uca kanıtlı.
- [ ] Denetçi ajan bütün işlemleri eşleştiriyor; mühürsüz bir işlemi yakalayıp `SicilBozuldu` yazabiliyor.
- [ ] SicilKasasi Fuji'de deploy edilmiş ve **verified**; jüri freni (`pause`) çalışıyor.
- [ ] Trader ve denetçinin ERC-8004 agentId'leri var; Reputation'a en az bir not yazılmış.
- [ ] Türkçe panel ve her iddianın Snowtrace linki hazır; yedek video çekilmiş; README'de kanıt tablosu var.

## B planı

**14:00 karar kapısı:** En az bir işlem mühür → emir → açıklama döngüsünü uçtan uca tamamlamadıysa denetçi ajan bırakılır, **ANAYASA** sunulur: `seal` fonksiyonundaki limit kontrolü kural kapısına dönüşür, Türkçe kural kartı + ret anı + jüri freni gösterilir. Kontrat, yürütücü ve panel aynen kalır.

**Asla kesilmeyecekler:** mühür → emir → açıklama döngüsü, denetçi ajan ve `SicilBozuldu`, jüri freni, verified kontrat.
