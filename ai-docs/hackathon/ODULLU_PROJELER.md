# Önceki OKX Hackathonları: Kazananlar, Kalıplar ve Fikirler

> Tarama: 15 Ekim 2026. Sadece OKX hackathonları ve OKX araçlarıyla (özellikle Agent Trade Kit) yapılmış projeler. Kaynaklar en altta.
> Projelerin kendi beyan ettiği rakamlar doğrulanmadı. X (Twitter) gönderileri bu ortamdan açılamadı; kazanan listelerinin bir kısmı bu yüzden eksik.

## 0. Önce net cevap

- **Bu hackathonun (Team1 × OKX TR Agentic Hackathon) önceki bir edisyonu bulunamadı.** Web'de ne önceki bir Ankara/İstanbul edisyonu ne de kazanan listesi var; 17 Ekim büyük ihtimalle ilk edisyon.
- **En yakın emsal OKX'in kendi "AI松" (AI Hackathon) serisi.** Özellikle **2. dönem tamamen Agent Trade Kit üzerineydi**, yani bizim kullanacağımız araçla yapılmış ve ödül almış projeler var. Aşağıda en çok buna odaklandım.

## 1. OKX'in önceki hackathonları (en alakalıdan en aza)

### 1.1 OKX Agent Trade Kit 「AI松」 2. dönem (Mart–Nisan 2026) — EN ALAKALI

| | |
|---|---|
| Konu | Agent Trade Kit (83 araç + 4 Skill) ile trading agent'ı |
| Katılım | 180 başvuru |
| Track'ler | **Build:** agent'ı kur, çalıştır, kullanım senaryosunu ve etkileşimli bir demo videosunu X veya OKX星球'de paylaş, formu doldur. **Creative (yeni):** deploy gerekmez, sadece trading agent fikri. |
| Değerlendirme | Başvurular **Gemini ile puanlanıp sıralandı** (insan jüri değil) |
| Ödül | 800 – 3.000 USDT |
| Önceki dönem | 1. dönem Onchain OS (zincir üstü cüzdan) temalıydı. OKX'in bir paylaşımına göre seri en az 5 dönem sürdü ("ilk 4 dönemde AI asistanınızdı, 5. dönemde danışmanınız"). |

**Kazananlar hakkında OKX'in kendi açıklaması:** "Geliştiriciler ATK'nin 83 aracıyla yeni şeyler yaptı: **genetik evrim algoritması, imza kapılı sandbox, çok-agent'lı harekât odası (war room), likidasyondan kurtulma (断尾求生, 'kuyruğu kesip kaçma') motoru**." İsim listesi bir X gönderisinde ve bu ortamdan açılamadı (link en altta; Arif açıp yapıştırırsa her birini incelerim).

Bu dört temayı ATK karşılığıyla okuyunca:

| Kazanan tema | Muhtemel çalışma şekli (çıkarım) | ATK'de hangi araçlar |
|---|---|---|
| Genetik evrim algoritması | Strateji parametreleri popülasyon gibi evrilir; demo hesapta yarışan varyantlardan iyiler hayatta kalır, kötüler elenir | `market` (mum verisi), demo profilde `spot`/`swap` emirleri, `account_get_bills` ile sonuç ölçme |
| İmza kapılı sandbox | Agent'ın emri, bir kural/imza kontrolünden geçmeden borsaya gitmez; önce demo/sandbox'ta denenir | `--read-only`, ayrı `demo` ve `live` profilleri, `account_get_max_size` |
| Çok-agent harekât odası | Analist, risk, yürütme gibi rollere bölünmüş agent'lar ortak bir ekranda tartışır, karar verir | `market`, `news`, `smartmoney`, `account`, emir araçları |
| Likidasyon kurtarma motoru | Kaldıraçlı pozisyon likidasyona yaklaşınca agent otomatik küçültür / hedge eder / kapatır | `account_get_positions`, `swap_place_algo_order` (stop), pozisyon kapama |

### 1.2 DARWIN — ATK ile yapılmış açık kaynak örnek (Mart 2026)

GitHub'da `okx-agent-trade-kit` etiketli tek proje. AI松 2. dönemle aynı haftalarda yayınlanmış; ödül alıp almadığı doğrulanamadı. Ama "genetik evrim" temasına çok yakın (adı ve stratejileri eleme/terfi mantığı), ve **ATK ile kazanan tarz bir projenin nasıl kurulduğunu birebir gösteriyor**. Tersine mühendislik için en iyi aday bu.

- **Ne yapıyor:** "Risk öncelikli AI trading yönetişim sistemi." Kullanıcı sadece risk seviyesi ve coin listesi seçer; sistem piyasayı okur, rejimi sınıflandırır, strateji seçer, OKX'te işlem yapar, risk kontrolü ve denetim raporu üretir.
- **Mimari (3 katman):**
  1. *Agent şirketi* (Paperclip AI): CTO (kök), Piyasa Analisti, Risk Agent'ı, Strateji Yöneticisi, Denetçi.
  2. *DARWIN çekirdeği:* durum tanıyıcı, sermaye dağıtıcı, devre kesici, strateji arşivi, 127.0.0.1:3200'de HTTP köprüsü, SQLite.
  3. *OKX ATK:* piyasa verisi, hesap/pozisyon, spot, swap, bot ve algo emirleri.
- **Döngüler (her agent kendi ritminde):** Analist 15 dk (ATR, funding, hacim, long/short oranı); Risk 5 dk (devre kesici); CTO 1 saat (rejim geçişi, sermaye dengeleme); Strateji Yöneticisi ve Denetçi günlük (terfi, düşürme, eleme, rapor). Rejim (yatay / trend / aşırı) **3 ardışık ölçümde** aynı kalmadan aksiyon yok.
- **Risk:** 4 kademeli devre kesici (stratejiyi durdur → coini durdur → her şeyi durdur → acil stop, manuel restart). Devre kesici sadece Risk Agent'ında; stratejiler onu ezemez. Aşırı rejimde sermayenin en fazla %5'i kullanılır.
- **"Önce gölge" yaşam döngüsü:** Her strateji önce **OKX demo hesabında** çalışır, kriterleri geçerse gerçek sermaye alır; 3 başarısız denemede elenir. (Genetik/doğal seçilim fikri bu.)
- **Kullandığı stratejiler:** spot grid, kontrat grid, DCA, trailing stop ile trend takibi, funding arbitrajı (delta-nötr), TWAP/iceberg. 6 strateji × 9 coin ≈ 54 örnek.
- **Demo hazırlığı:** `pnpm run overview` (anahtarsız), `pnpm run verify` (OKX demo kontrolü), canlı dashboard, ve 3 hazır senaryo: normal çalışma, rejim geçişi, devre kesici + onay. Yani demo sahnede "olayı tetikleyerek" gösteriliyor.
- **Stack:** TypeScript (strict ESM), SQLite, 15 LLM sağlayıcıdan opsiyonel zenginleştirme.

### 1.3 OKX.AI Trading Hackathon, 1. sezon (11–25 Ağustos 2026)

- 2 hafta **canlı** yarışma, $40.000. Katılımcı iki yoldan birini seçiyor: Onchain OS (zincir üstü) ya da **Agent Trade Kit (sadece USDT perpetual)**.
- Sıralama sadece getiri (% PnL) + net PnL. Jüri yok. Şart: en az 300 USDT bakiye, en az 1 işlem, yarışma boyunca çevrimiçi kalmak.
- Kazananlar: 1. **1M · 斯巴达** ($10.000), 2. **Pools Sentine** ($7.000), 3. **磐衡量化** ($4.500), 4–40. sıra $500. Proje açıklaması yayınlanmamış.
- **Ders:** Burada kazanan, piyasa döneminde en çok kazandıran; bizim jüri puanlamalı yarışmamıza doğrudan aktarılamaz. Ama OKX'in ATK'yi "perp + canlı hesap + kesintisiz çalışan agent" olarak konumladığını gösteriyor.

### 1.4 OKX AI Genesis Hackathon (2–27 Temmuz 2026)

- $100.000, X Layer üzerinde "Agentic Service Provider (ASP)" yani gerçek kullanıcıya hizmet veren otonom AI servisleri. Kategoriler: Best Product, Creative Genius, Revenue Rocket, **Finance Copilot** (piyasa analizi, karar, iş akışı otomasyonu), Software Utility, Lifestyle, Art, Social Buzz.
- Değerlendirme: OKX iç incelemesi; **servis çevrimiçi ve çalışır olmalıydı** (çalışmayan pek çok başvuru elendi).
- 28 kazanan ASP; "Revenue Rocket" kategorisinde kriteri geçen çıkmadı. Kazanan isimleri X'te, buradan açılamadı.
- **Ders:** OKX jürisi "gerçekten çalışan, gerçek kullanıcıya bir şey yapan" agent istiyor; demo günü bir şeyin çökmemesi kritik.

### 1.5 OKX ETHCC Hackathon (DoraHacks)

ATK'den önceki dönem, OKX DEX API ile. AI/trading kazananları:
- **Trendpup** (DeFi & Otonom Uygulamalar 1.): memecoin yatırımı için çok-agent'lı AI asistanı; OKX DEX API ile öneri verip işlemi yürütüyor.
- **Yamata** (Altyapı 1.): hibrit order book + OKX DEX'e bağlı arbitraj botları, otomatik trading.
- **AgenPay** (Altyapı 2.): Notion içinde otonom ödeme yapan agent'lar.
- **Rivalz Auto Agents Marketplace** (özel ödül): token sepetleriyle gelir üreten NFT-agent pazarı.
- **Ders:** OKX kazananlarında "çok-agent + OKX API ile gerçek yürütme" kalıbı ATK'den önce de vardı.

## 2. OKX kazananlarından çıkan ortak kalıplar

1. **Kural koyan katman LLM'den ayrı.** AI松'daki "imza kapılı sandbox", DARWIN'in "devre kesici sadece Risk Agent'ında" kuralı. LLM önerir, kod onaylar.
2. **Roller ayrılmış çok-agent yapı.** "Harekât odası", DARWIN'in CTO/Analist/Risk/Denetçi şirketi, Trendpup. Ama her rol net bir iş yapıyor, tiyatro değil.
3. **Agent kendini iyileştiriyor / eliyor.** Genetik evrim, DARWIN'in terfi-eleme döngüsü. Otonomiyi "sadece al/sat" değil, "stratejisini kendi yönetiyor" seviyesine çıkarıyor.
4. **Kriz anı senaryosu.** Likidasyon kurtarma motoru, DARWIN'in 4 kademeli devre kesicisi. Demoda en etkileyici an, agent'ın kötü bir durumu kendi başına yönetmesi.
5. **Demo hesabında önce, canlıya sonra.** ATK'nin `demo` profili bunu kolaylaştırıyor; DARWIN'de bu bir kural.
6. **Gösterilebilir demo.** AI松 Build track'i video şart koştu; DARWIN hazır senaryolarla sahnede olay tetikliyor; Genesis'te çalışmayan servis elendi.
7. **ATK'nin geniş araç setini kullanmak.** OKX özellikle "83 aracı yeni şekillerde kullandılar" diye övdü: funding rate, long/short oranı, algo emirler, bot modülü. Sadece `spot_place_order` çağıran bir agent sıradan kalıyor.

## 3. Boşluklar (OKX kazananlarında görülmeyen)

Çıkarım; kazanan listesinin tamamını göremediğim için kesin değil.

- **Avalanche bağlantısı:** OKX kazananlarının hiçbiri Avalanche'a bir şey yazmıyor. Bizim hackathonda bu bonus puan.
- **Kullanıcının kendi koyduğu kural:** Kazananlarda risk kuralları geliştirici tarafından sabit. Kullanıcının Türkçe yazdığı talimatı denetlenebilir kurala çeviren bir agent görmedim.
- **ATK `news` ve `smartmoney` modülleri:** Kazanan temalarında haber ve smart money takibi geçmiyor; DARWIN bile sadece fiyat/funding/hacim kullanıyor.
- **Türkiye / OKX TR:** `site = "tr"`, Türkçe açıklayan agent. Jüri OKX TR ağırlıklı.

## 4. OKX kazananlarına dayanan 3 fikir

Hepsi aynı iskelet: `ATK veri → LLM analiz → koddan risk kapısı → ATK emir (demo profil) → log + Avalanche Fuji kaydı → canlı dashboard`.

### Fikir 1 (önerilen): "Yeminli Agent" — imza kapılı sandbox + kullanıcı kuralı + Avalanche

- AI松'daki "imza kapılı sandbox" temasını alıp bir adım ileri götürür: kuralları kullanıcı Türkçe yazar ("ayda %5'ten fazla kaybetmek istemem, kaldıraç en fazla 3x, memecoin yok").
- Agent bunu `policy.json`'a çevirir, kullanıcı onaylar, kuralların hash'i Avalanche Fuji'deki küçük bir kontrata yazılır.
- Otonom döngü: ATK `market` + `news` + `smartmoney` → LLM öneri → risk kapısı allow / küçült / reddet → ATK demo emri → her karar Fuji'ye kayıt.
- **Demo anı:** Agent'ı kötü bir habere kışkırt, kuralı aşan emri kapının reddettiğini ve kaydın Snowtrace'te göründüğünü göster.

### Fikir 2: "Darwin + Kurtarıcı" — kendini eleyen stratejiler ve likidasyon kalkanı

- DARWIN'in "önce demo, sonra canlı, başarısızsa ele" döngüsünü sadeleştir (3–4 strateji yeter) ve AI松'daki "likidasyon kurtarma motoru" temasını ekle.
- Rejim (yatay / trend / panik) → uygun strateji; Risk Agent 1 dakikada bir pozisyonları izler, likidasyon mesafesi daralınca kademeli küçültür, stop koyar ya da kapatır.
- **Demo anı:** Demo hesapta kaldıraçlı pozisyonu sahnede ani hareketle sıkıştır, agent'ın kendi başına kurtardığını göster. Strateji tablosunda birinin elendiğini göster.
- Risk: DARWIN'e çok benzememesi için "kurtarıcı" kısmı ana hikâye olmalı.

### Fikir 3: "Harekât Odası" — Türkçe tartışan çok-agent masası

- AI松'daki "çok-agent war room" temasının sade, Türkçe versiyonu: Haberci (`news`), Balina Takipçisi (`smartmoney`), Teknik Analist (`market`), Risk Şefi (veto hakkı). Her tur ekranda Türkçe tartışma, sonra karar ve ATK emri.
- Kararlar ve hangi agent'ın haklı çıktığı Avalanche'ta itibar puanı olarak tutulur; zamanla isabetli agent'ın oyu ağırlaşır.
- **Demo anı:** Canlı tartışma ekranı + Risk Şefi'nin veto ettiği bir tur.

**Öneri sırası:** 1 > 2 > 3. Fikir 1 iki bonusu da doğal alıyor ve OKX kazananlarında olmayan bir şey (kullanıcı kuralı + zincir kaydı) ekliyor. Fikir 2'nin likidasyon kalkanı, Fikir 1'in risk kapısına modül olarak eklenebilir.

## 5. Tersine mühendislik için önerilen sıra

1. DARWIN reposunu klonla, `pnpm run overview` ve `pnpm run verify` (demo key ile) çalıştır; agent'ların ATK'yi nasıl çağırdığına, devre kesiciye ve demo senaryolarına bak. (Kod 17 Ekim'den önce yazılmayacak; bu sadece okuma ve anlama.)
2. AI松 2. dönem kazanan listesini X'ten aç (link aşağıda), her kazananın videosuna bak: demo nasıl kurgulanmış, kaç dakika, hangi ATK araçları ekranda.
3. `okx/agent-skills` reposundaki resmi skill'leri oku: OKX'in "doğru kullanım" saydığı akışlar orada.

## 6. Erişilemeyenler

- AI松 2. dönem ve AI Genesis kazanan isimleri yalnızca X'te; bu ortamdan X açılamıyor.
- Arif'in lokalindeki tersine mühendislik reposu bu thread'den görülmedi (cihaz bağlı ama paylaşılmış klasör yok, yol bilinmiyor).

## Kaynaklar

- AI松 2. dönem kazanan duyurusu (X): https://x.com/okxchinese/status/2039593807210258786
- AI松 2. dönem kuralları: https://www.jhth.cn/live/47814.html · https://www.mexc.com/news/894685
- AI松 5. dönem duyurusu (X): https://x.com/okxchinese/status/2063257600981123261
- DARWIN: https://github.com/Wxiaobai123/DARWIN · GitHub etiketi: https://github.com/topics/okx-agent-trade-kit
- OKX.AI Trading Hackathon: https://www.okx.ai/hackathon
- OKX AI Genesis: https://www.hackquest.io/hackathons/OKXAI-Genesis-Hackathon
- OKX ETHCC Hackathon özeti: https://www.odaily.news/en/post/5206007
- ATK Skills Marketplace: https://www.okx.com/en-us/learn/agent-trade-kit-skills · https://github.com/okx/agent-skills
