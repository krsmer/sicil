# Active Context

> Bu dosya "şu an neredeyiz" sorusunun cevabı. Her görevden sonra güncellenir; en yeni kayıt en üstte. Saatler Türkiye saati (UTC+3); gün içi kayıtların saatleri git commit zamanlarından.

## Şu anki durum (17 Ekim 2026, ~13:40)

**SİCİL CANLI** (`sicilBaslangic` 13:01:34). Üç süreç Arif'in Mac'inde çalışıyor:

| Süreç | Başlatma | Log | Durdurma |
|---|---|---|---|
| Trader ajan (15m tur) | `nohup agents/trader/calistir.sh &` (caffeinate + otomatik yeniden başlatma) | `agents/logs/ajan.out`, `trader.jsonl` | `touch agents/logs/DUR && pkill -TERM -f "node trader/ajan.mjs"` (tur ortasındaysa tur bitince çıkar) |
| Denetçi (60 sn) | `nohup agents/denetci/calistir.sh &` | `agents/logs/denetci.out`, `denetci.jsonl`, durum `denetci-durum.json`, raporlar `reports/` | `touch agents/logs/DUR-DENETCI && pkill -TERM -f "node denetci/denetci.mjs"` |
| Panel | `nohup node agents/panel/sunucu.mjs &` | `agents/logs/panel.out` | `pkill -f "node panel/sunucu.mjs"` |

Panel: http://127.0.0.1:8787 · Kasa `0x60735035CC6f4d810f4878f9A4a1993F534fe6a8` · trader agentId 258, denetçi 259.

**Kurallar (canlı süre boyunca):** Demo hesapta **elle işlem yok** (sahnedeki canlı yakalama hariç). Denetçi raporları saatte bir (~:24'te) kendisi commit+push eder; o dakikalarda kodlama oturumunda git işlemi yapma (denetçi `index.lock` görürse o saati atlar).

**Sıradaki (öncelik sırasıyla):** LLM AL/PAS dağılımını izle (aşağıda) → ERC-8004 Validation (panelden sonraya bırakılmıştı) → README kanıt tablosu → 17:00 kod dondurma, prova, yedek video → teslim öncesi git geçmişi gizli bilgi taraması, sonra repo public.

## Gözlem: LLM kararlarının dağılımı (K-16 izleme)

| Zaman | Ortam | Karar | Çarpan | Güven | Not |
|---|---|---|---|---|---|
| 12:57 | Test (sahte aday, araçlı) | AL | 0,7 | 64 | 3 araç (funding, OI, RSI) |
| 13:02 | Canlı, BTC ortalamaya dönüş | AL | 0,7 | 64 | Mühür #2 |

İki karar aynı (AL / 0,7 / 64). Sistem talimatında örnek sayı **yok** (kontrol edildi). **Plan:** ilk 4-5 aday turunda AL / BEKLE / PAS oranını izle (`grep '"adim":"karar"' agents/logs/trader.jsonl` veya panel). Hep AL derse talimatı daha eleştirel yap ("kanıt zayıf ya da çelişkiliyse PAS; AL için en az iki bağımsız destekleyici işaret"). 13:40 itibarıyla LLM artık geçmiş tez sonuçlarını denetçinin son raporundan görüyor.

## Açık kararlar

| Karar | Seçenekler | Not |
|---|---|---|
| Zaman çıkışı (tez süresi dolunca satış) | Ekle · Ekleme | Şimdilik yok. Eklenirse **önce** denetçiye o satış için eşleştirme kuralı ve testi eklenmeli; yoksa ajanın kendi zaman çıkışı mühürsüz sayılıp sicili bozar |
| PAS kararları ve adaylar zincire yazılsın mı | Hayır (plan) · Ucuz bir olayla evet | Şu an sadece yerel log + panel; jüri "sonradan seçtiniz" diyebilir. Zaman kalırsa |
| Canlı hesap (Bonus 1) | Sadece demo · Küçük canlı alt hesap | Organizatöre "demo sayılıyor mu" sorulacak |
| Canlı yakalama nerede | Ana hesap (plan: kalıcı kırmızı) · İkinci hesap | Plan ana hesap. TR demo arayüzünden elle işlem; olmazsa mühürsüz emir gönderen küçük script |
| `news` (seçenek a) | Canlı TR'de sadece Read anahtar | K-11: vakit kalırsa |
| `setAgentWallet` | Yap · Yapma | K-12: en sona, en fazla 20 dk |

Kapanan kararlar `decisionLog.md`'de: K-11 (news yok, global piyasa verisi), K-12 (ERC-8004 kayıtları), K-13 (kasa ayrıntıları), K-14 (fren = Brave'deki MetaMask, Account 1), K-15/K-16 (LLM: Gemini `gemini-3.8-flash`, 1H rejim + 15m giriş, 4 araç / 45 sn), BTC-TRY eklenmedi.

## Bilinen riskler (aktif)

- **Sakin piyasa → az aday.** Akşama 10+ sonuçlanmış tez hedefi tutmayabilir; sunumda örnek sayısının az olduğu dürüstçe söylenir.
- **Demo ücretleri** (maker %0,08 + taker %0,10 ≈ %0,18 gidiş-dönüş) 15m ATR hedeflerinin (~%0,34) yarısını yiyor; net getiri büyük ihtimalle eksi. İddia "kâr" değil, "dürüst sicil".
- **Repo private:** `feedbackURI` dışarıdan açılmıyor; teslimden önce gizli bilgi taraması + public.
- **Salon Wi-Fi'si / RPC:** panel ve ajanlar Fuji genel RPC'sine bağlı; yedek RPC ve telefon hotspot'u sabah listesinde açık.

## Son değişiklikler

- **14:30:** Panele "Kurallar (zincirde, değiştirilemez)" kartı: kullanıcının Türkçe kuralı + kontrattan canlı okunan 5 değer (kullanıcıdan gelen 3'ü / sistem kuralı 2'si ayrı etiketli), deploy tx ve Snowtrace Read Contract linki (tarayıcıda açılıp doğrulandı; Snowtrace'te kaynak kod da görünüyor). Sadece `agents/panel/index.html` değişti. demoScript'e kuralın deploy'da kontrata nasıl yazıldığı eklendi. "Kuralını yaz" ekranı: sadece her şey bitip vakit kalırsa, gerçek deploy yapmayan gösterim olarak.
- **13:49–14:03:** Fren provası başarılı: panel → MetaMask `pause()` (13:49) → ajan 14:00 turunu atladı → sahip `unpause()` (14:03). Ajan 14:15 turundan itibaren normal.
- **13:45:** Düzeltme (Arif): fren hesabı Core değil, **Brave'deki MetaMask (Account 1)**; adres ve kontrat aynı. K-14, systemPatterns, techContext, demoScript ve panel düzeltildi; panel MetaMask'i EIP-6963 `io.metamask` ile seçer, Brave Wallet'ı otomatik seçmez. `assets/mimari.png` hâlâ "Core cüzdan" yazıyor (görsel; sunumdan önce düzeltilmeli).
- **13:40:** Bağımsız inceleme düzeltmeleri: (1) stop/hedef **15m ATR**'den (2,0× / 3,0×; BTC'de ~%0,23 / ~%0,34; önce 1H ATR ile %0,59 / %0,78 idi ve pozisyon saatlerce açık kalıp pariteyi kilitliyordu); zaman çıkışı eklenmedi. (2) LLM'e geçmiş tezler artık **denetçinin son raporundan** (tuttu/tutmadı/bekliyor + Brier). (3) demoScript 5:00–6:00 ret sahnesi metni düzeltildi ("saatte bir zincire sunuyor, zincir reddediyor"). (4) Denetçinin rapor push'u: `index.lock` varsa atla, push öncesi `pull --rebase --autostash`, hata olursa o saatin notu atlanır. (5) Bu dosya temizlendi. Trader ve denetçi turlar arasında yeni koda geçirildi.
- **13:33:** Türkçe panel (`agents/panel/`): sicil damgası (TEMİZ/BOZUK), mühür defteri (mühür → emir süresi; #2'de mühür emirden 4,6 sn önce), yapay zekâ kararları + araçlar, ret kayıtları, denetim + ERC-8004 notları, Snowtrace linkleri, MetaMask EIP-1193 "Freni çek" (EIP-6963 ile MetaMask seçilir, yetki ve Fuji ağı kontrolü, `pause()` = `0x8456cb59`).
- **13:24:** ERC-8004 Reputation canlı: denetçi saatte bir raporları commit+push edip trader'a (258) net getiri + Brier notu verir; ilk not −%0,05 (zincirden `getSummary` ile okundu). Brier ilk tez sonuçlanınca.
- **13:23:** Çökme güvencesi: açıklanmamış mühür Brier'e güven = 100 ile girer (Arif onayladı); seal öncesi `agents/logs/bekleyen-acilislar.json`, ajan açılışında kurtarma (6 test).
- **13:16:** Denetçi canlı: eşleştirme etiket + algoId + ordIdList + zaman (10 test); attest yapısal değişiklikte hemen, getiri için 10 dk kalp atışı, zarar limitinde hemen. İlk attest 13:14, sicil temiz.
- **13:09:** Ajan `calistir.sh` (caffeinate + otomatik yeniden başlatma); SIGTERM'de tur bitince çıkar; aynı turda mühür atıldıysa 300 sn bekleme dolunca diğer parite değerlendirilir.
- **13:01–13:03:** Sicil başlatıldı (ön kontrol: açık emir 0, bekleyen algo 0). İlk otonom döngü: Gemini AL → ret anı (51,02 > 20 USDT, zincirde reverted) → mühür #2 → doldu → reveal → OCO.
- **12:57 · K-16:** LLM Gemini `gemini-3.8-flash` (Claude Sonnet 5.5 yerine; Arif'in anahtarı). En az bir araştırma aracı zorunlu.
- **12:46 · K-15:** Ajan döngüsü + LLM karar katmanı (4 araç / 45 sn → BEKLE; 1H rejim + 15m giriş; tez 60–120 dk).
- **12:31–12:38:** Yürütücü iskeleti, ilk uçtan uca döngü (mühür #1, sicil öncesi), OCO çıkışı doğrulandı (çıkış emrinde `algoClOrdId` var, dolumda yok); net getiri sadece mühürlü dolumlardan; `sicil-baslat.mjs` açık emir/OCO kontrolü; demo ücretleri dürüstleştirildi; kural motoru + simülasyonsuz ret mührü.
- **12:20–12:25 · K-13/K-14:** `SicilKasasi` (28 Foundry testi, viem hash eşleşmesi `ffi` ile kanıtlı) Fuji'de, Builder Hub + Snowtrace verified; fren = Brave + MetaMask (Account 1) `0xFD05…c35e`.
- **12:04–12:10 · K-12:** ERC-8004 imzaları kaynak koddan doğrulandı; trader (258, sahibi sahip) ve denetçi (259) kaydedildi.
- **11:52–12:00:** Repo açıldı (private), BTC-TRY ölçüldü (eklenmedi), Foundry + Fuji deploy/verify hattı (`SicilPing`).
- **11:25–11:50 (repo öncesi):** TR demo profilleri (`demo`, `denetci`, anahtarsız `piyasa`), ilk demo emir, OCO testleri, `news` demo modda kapalı (K-11).
- **16 Ekim akşam:** Kurulum (ATK 1.4.8, Foundry 1.8.5, 4 keystore, Fuji AVAX), memory bank, plan SİCİL olarak kesinleşti.
