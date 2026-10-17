# Progress

> Kutucukları işaretle, saat yaz. Doğrulama kaydına her testin sonucunu ekle.

## Yol haritası

| Aşama | Durum |
|---|---|
| 0. Araştırma: geçmiş OKX / Avalanche / İstanbul kazananları | ✅ 16 Ekim |
| 1. Fikir seçimi: KUYRUK → SİCİL | ✅ 16 Ekim |
| 2. Gece kurulumu | 🟡 Devam ediyor |
| 3. Hackathon günü: 10:00–19:00 | ⬜ 17 Ekim |
| 4. Sunum: 20:00 | ⬜ 17 Ekim |

## Aşama 2: Gece kurulumu (16 Ekim)

- [x] Node.js (v22.22.0)
- [x] ATK MCP + CLI 1.4.8 kur; TR piyasa verisini test et
- [x] Foundry 1.8.5 kur; Fuji RPC ve cancun derlemesini test et
- [x] 4 Fuji cüzdanı (şifreli keystore) oluştur
- [x] Test AVAX al ve dağıt (sahip 0,19 · trader 0,15 · denetçi 0,10 · fren 0,05)
- [x] Memory bank ve proje notları
- [x] Ekip incelemesi: 4 eksik plana eklendi
- [ ] **Bu gece commit atma** (ilk commit yarın 10:00)
- [ ] OKX TR demo erişimi + 2 API anahtarı (trader: okuma+işlem, denetçi: sadece okuma)
- [ ] `okx config init` → `demo` ve `denetci` profilleri; bakiye testi
- [ ] İkinci telefona Core cüzdanı; fren adresi kararı
- [ ] "Örnek" etiketli sahte sinyal ekran görüntüsü (slayt 1)
- [ ] Slayt iskeleti, sunum metni, soru-cevap tablosu ekipte paylaşıldı
- [ ] İş bölümü kesinleşti (aşağıdaki tabloya isim yaz)
- [ ] Organizatöre "önceden kod serbest mi" soruldu
- [ ] Diğer ekip üyelerinin makinelerinde ATK + Foundry kurulu

## Aşama 3: Hackathon günü

![Saat planı](assets/saat-plani.png)

### Karar kapıları

| Saat | Kapı | Şart | Durum |
|---|---|---|---|
| 10:30 | TR demo kararı | TR demo profili ile bakiye + bir `post_only` emir çalışıyor mu? Hayırsa canlı küçük spot hesap veya global demo | ✅ 11:45 TR demo çalışıyor |
| 12:30 | Ajan canlı | Trader ajan insansız çalışmaya başladı; sicil birikiyor | ⬜ |
| **14:00** | **SİCİL / ANAYASA** | En az bir işlem mühür → emir → açıklama döngüsünü uçtan uca tamamladı mı? Hayırsa ANAYASA | ⬜ |
| 17:00 | Kod dondurma | Yeni özellik yok; sadece hata düzeltme, prova, video | ⬜ |
| 19:00 | Teslim | Repo, README, video | ⬜ |

### İş kolları

| Kol | Sorumlu | Saat | İş |
|---|---|---|---|
| Herkes | — | 10:00–10:45 | Sabah kontrol listesi |
| Kontrat | _isim_ | 10:45–12:15 | SicilKasasi, Foundry testleri, deploy |
| Kontrat | _isim_ | 12:15–14:00 | ERC-8004 kimlikleri, fren, verify |
| Trader ajan | _isim_ | 10:45–12:30 | ATK yürütücü ve mühür döngüsü |
| Trader ajan | _isim_ | 12:30–19:00 | Canlı çalışıyor, sicil birikiyor (LLM karar katmanı burada olgunlaşır) |
| Denetçi ajan | _isim_ | 12:30–14:00 | Dolumlar ve mühür eşleştirme |
| Denetçi ajan | _isim_ | 14:00–16:00 | `attest`, Reputation, Validation |
| Panel ve sunum | _isim_ | 14:00–17:00 | Türkçe panel, Snowtrace linkleri |
| Panel ve sunum | _isim_ | 17:00–18:15 | 3 prova, yedek video, README |
| Herkes | — | 18:15–19:00 | Tampon ve teslim |

Dört kişiyseniz her kola bir kişi; üç kişiyseniz kontratı bitiren kişi 14:00'te panel ve sunum koluna geçer.

### Sabah kontrol listesi (10:00–10:45)

**Organizatöre:**
- [ ] Önceden kod veya şablon kullanmak serbest mi? (Bu repo sadece doküman ve şablon içeriyor.)
- [ ] Takım büyüklüğü, teslim formatı (repo / video / slayt)?
- [ ] Demo hesapla yapılan işlemler Bonus 1 için sayılıyor mu?
- [ ] TR hesabında (demo dahil) vadeli işlem açık mı? (Sadece bilgi.)

**OKX ve ATK:**
- [ ] `okx --version` = 1.4.8, `okx diagnose` temiz, profilde `site = "tr"`
- [x] TR demo çalışıyor mu? (bakiye, `system_get_capabilities`) ✅ 11:40
- [x] `spot_place_order` ile `post_only` + `clOrdId` (ör. `sicil000001`) emir gidiyor mu? Fiyat demo piyasa verisinden mi alınmalı?
- [ ] `spot_get_order` ve `spot_get_fills` yanıtlarında `clOrdId` geri okunuyor mu? (`spot_get_order` ✅; fills için dolum gerekiyor)
- [x] `spot_place_algo_order` OCO kabul ediliyor mu? ✅ (12:05; ayrıntı doğrulama kaydında) `algoClOrdId` ile işaretlenebiliyor mu? Tetiklenen çıkış emrinde `algoId`/`algoClOrdId` görünüyor mu?
- [x] Denetçi için sadece okuma anahtarı çalışıyor mu? ✅ (smart registration gizlemiyor → `--read-only` zorunlu)
- [x] `news_get_by_coin` TR anahtarıyla çalışıyor mu? ❌ demo modda kapalı; canlı Read anahtarı ya da OAuth gerekir
- [x] BTC-TRY'de 20 USDT'lik emir ne kadar kayıyor? Canlı 5,8 bps; demo defteri bozuk → BTC-TRY eklenmedi

**Avalanche Fuji:**
- [ ] Dört cüzdanda AVAX var mı? (16 Ekim: var)
- [ ] Boş bir kontrat deploy + verify (cancun)
- [ ] `register` ile iki agentId (trader, denetçi); Reputation ve Validation imzaları Snowtrace'te kontrol
- [ ] Denetçi cüzdanından deneme `giveFeedback`
- [ ] Salon Wi-Fi'sinde olay dinleme gecikmesi; yedek RPC ve telefon hotspot'u
- [ ] İkinci telefonda Core kurulu, fren adresi fonlu
- [ ] **WorkshopHub `checkIn`'i deneme olarak YAPMA** (aynı adresten ikinci kaydı reddediyor)

**Repo ve sicil:**
- [x] Repo açıldı, ilk commit gün içinde atıldı (17 Ekim ~12:25, https://github.com/krsmer/sicil, private)
- [ ] Sabah test emirleri `sicilBaslangic`'ten **önce** atıldı (sicile girmeyecekler)

### Asla kesilmeyecekler
Mühür → emir → açıklama döngüsü · denetçi ajan ve `SicilBozuldu` · jüri freni · verified kontrat.

### Zaman yetmezse kesilecekler (sırayla)
1. x402 abonelik (zaten plan dışı)
2. İkinci hesapta canlı yakalama
3. Haber ve duygu araçları (LLM daha az veriyle karar verir)
4. BTC-TRY paritesi
5. Validation kaydı (Reputation ve kontrattaki `attest` kalır)

## Teslim ölçütleri (19:00)

- [ ] Repo: tek komutla kurulum, gizli anahtar yok, `DRY_RUN` modu
- [ ] README: jüri kriterlerine göre kanıt tablosu (her iddia → Snowtrace / OKX emir numarası), ATK araç çağrı zinciri, kullanılan model ve prompt'lar
- [ ] Foundry test çıktısı
- [ ] SicilKasasi verified, adres README'de
- [ ] Yedek video (17:30 çekimi)

## Doğrulama kaydı

| Tarih | Ne test edildi | Sonuç |
|---|---|---|
| 16 Ekim 20:35 | `okx --site tr market ticker BTC-USDT` | ✅ Çalışıyor |
| 16 Ekim 20:35 | TR'de `USDT-TRY`, `BTC-TRY` pariteleri | ✅ Var |
| 16 Ekim 20:37 | Fuji RPC `cast chain-id` | ✅ 43113 |
| 16 Ekim 20:37 | `AgentDecisionLog.sol` şablonu cancun ile derleme | ✅ `evmVersion: cancun` |
| 16 Ekim 20:40 | 4 keystore: şifreyle açma + imza + doğrulama | ✅ |
| 16 Ekim 20:50 | Sahip → trader/denetçi/fren AVAX transferi | ✅ 3 işlem başarılı |
| 16 Ekim | ERC-8004 üç proxy adresinde kod ve implementasyon | ✅ |
| 16 Ekim | ATK araç adları (SİCİL'in kullandıkları) kaynak kod ve katalogla | ✅ (bkz. `techContext.md`) |
| 16 Ekim 21:30 | WorkshopHub `0x0a5aa2e3…bc95d` adresinde kontrat kodu | ✅ |
| 17 Ekim | Repo taraması: `okx --version` 1.4.8, `forge` 1.8.5, 4 keystore yerinde | ✅ |
| 17 Ekim 11:25 | `~/.okx/config.toml` `demo` profili (TR demo anahtarı: Read+Trade, Spot, USDT/BTC/ETH+1) | ✅ `okx --profile demo account balance` çalışıyor: USDT 5000, BTC 1, ETH 1, TRY 200000, OKB 100 (~$104,8k). `denetci` profili henüz yok |
| 17 Ekim | `node --version` | ⚠️ v25.6.1 (PATH); belgelenen v22 ayrıca kurulu |
| 17 Ekim | TR demo trading var mı | ✅ Var: tr.okx.com → More → Demo trading; demo API: profil → Demo Trading API → "Create V5 API key for demo trading" |
| 17 Ekim | TR demo piyasa (arayüzden, USDT/TRY) | ⚠️ Demo fiyatı 29,00 TRY (canlı ~49), 24s hacim 0; demo ücreti maker %0,10 / taker %0,20 (sıfır değil). BTC-USDT/ETH-USDT demo likiditesi kontrol edilecek |
| 17 Ekim 11:27 | Demo piyasa verisi BTC-USDT | ✅ `--demo` ile: son fiyat canlıyla aynı (~81.717), makas 0,1 $, 24s hacim ~39k BTC → likit. **CLI'da `--demo` verilmezse profil demo olsa da canlı veri döner.** USDT/TRY demo fiyatındaki sapma TRY'ye özgü |
| 17 Ekim 11:40 | `denetci` profili (TR demo, sadece Read) | ✅ `account balance` çalışıyor (aynı demo hesap) |
| 17 Ekim 11:40 | ATK "smart registration" (Trade izni yoksa emir araçlarını gizler) | ❌ **TR demo'da çalışmıyor**: Read-only anahtarla da 12 yazma aracı listeleniyor. `--read-only` bayrağıyla 0 yazma aracı ✅. Sonuç: denetçi ve LLM süreçlerinde `--read-only` **zorunlu**; borsa tarafında da anahtar zaten Read-only |
| 17 Ekim 11:45 | İlk TR demo emri: BTC-USDT buy `post_only` 0,00012 @ 80880,9 (bid −%1), `clOrdId=sicil000001` → ordId 4017254314926780417 | ✅ `sCode 0`, gönderim ~1 sn. `spot get --clOrdId` ile geri okundu (trader ve denetçi anahtarıyla). İptal edildi, `state=canceled`, dolum yok. Emir nesnesinde `algoId`/`algoClOrdId`/`attachAlgoClOrdId` alanları **var** (boş) → OCO eşleştirmesi için umut verici. ATK emre `tag: "CLI"` ekliyor. BTC-USDT: minSz 0,00002, tickSz 0,1 |
| 17 Ekim 11:50 | OCO (4a, tetiklenmeyen): sell 0,00012 BTC, TP +%5 / SL −%5 (piyasa), `algoClOrdId=sicil000001x` → algoId 4017257012736667649 | ✅ Kabul edildi; denetçi anahtarıyla `spot algo orders` içinde `algoClOrdId` geri okundu; iptal edildi (pending boş). CLI'da algoClOrdId bayrağı `--clOrdId`; `--tpOrdPx=-1` `=` ile yazılmalı. `--history` varsayılan olarak sadece `effective` (tetiklenmiş) olanları gösteriyor |
| 17 Ekim 12:05 | OCO (4b): `algoClOrdId=sicil000002x`, SL −%0,02 → doğal tetiklendi (SL tarafı), market satış dolumu | ✅ **Bağlantı kurulabiliyor, ama sadece emir üzerinden.** Tetiklenen emir: ordId 4017280697166049281, `clOrdId="O4017280697042617344"` (**borsa üretiyor, bizim değil**), `algoId` + `algoClOrdId=sicil000002x` **emirde dolu**, `source="7"`. **Dolum kaydında `algoClOrdId` yok** (sadece ordId, clOrdId=O…). Tek emir **2 dolum** olarak geldi. Taker ücreti %0,10 (`feeRate -0.001`). Algo geçmişinde `ordIdList` + `actualSide: "sl"` var |
| 17 Ekim 12:05 | `news` modülü TR demo anahtarıyla | ❌ "News features are not available in demo/simulated trading mode." Demo anahtar + `--live` → 50101 (ortam uyuşmazlığı). Anahtarsız çalışmıyor (`okx-auth` istiyor). Açmanın yolu: **canlı** TR anahtarı (sadece Read) ya da `okx-auth login --site tr` (OAuth) |

| 17 Ekim 12:30 | 20 USDT (988 TRY) emrin kayması, emir defterinden (emir yok) | BTC-USDT canlı ve demo: makas ~0, kayma 0 bps (1 kademe) ✅. BTC-TRY **canlı**: makas 11,5 bps, piyasa emri kayması 5,8 bps (1 kademe), ilk 5 kademe ~0,9–1,2 M TRY. BTC-TRY **demo: kullanılamaz** (orta fiyat 130 TRY, satış tarafında 6 TRY derinlik) ❌ |
