# SicilKasasi

SİCİL'in Avalanche Fuji'deki kasası: [`0x60735035CC6f4d810f4878f9A4a1993F534fe6a8`](https://testnet.snowtrace.io/address/0x60735035CC6f4d810f4878f9A4a1993F534fe6a8) (Builder Hub + Snowtrace verified, solc 0.8.24, `evm_version = cancun`, `via_ir`).

Trader her emirden önce kararını **mühürler**, emirden sonra **açar**; bağımsız denetçi hesabın bütün dolumlarını mühürlerle eşleyip sonucu **attest** eder. Mühürsüz tek bir işlem sicili kalıcı olarak bozar. Limitler kurulumda verilir ve değişmez (`immutable`).

## Fonksiyonlar

| Fonksiyon | Kim | Ne yapar |
|---|---|---|
| `seal(commitHash, pair, notionalCent) → id` | trader | Parite izinli mi, `0 < tutar ≤ maxTutarCent`, iki mühür arası `beklemeSn` doldu mu, kasa durdurulmamış mı. `Sealed(id, commitHash, pair, notionalCent, ts)` |
| `reveal(id, side, priceE8, sizeE8, thesis, confidence, salt, okxOrdId)` | trader | `keccak256(abi.encode(pair, side, priceE8, sizeE8, thesis, confidence, salt))` mühürle eşleşmeli; tek sefer; `aciklamaPenceresiSn` içinde; `priceE8 × sizeE8` mühür tutarını 1 centten fazla aşamaz. Durdurulmuş kasada da çalışır |
| `attest(upToTs, matched, unmatched, unrevealedExpired, dayPnlCent, reportHash)` | denetçi | `unmatched > 0` → kalıcı `SicilBozuldu`; `dayPnlCent ≤ −maxGunlukZararCent` → otomatik fren |
| `pause()` / `unpause()` | fren veya sahip / sadece sahip | Jüri freni |
| `setSicilBaslangic()` | sahip, bir kez | `block.timestamp` yazar; geriye tarih atılamaz |
| `report(hub, name, agentId)` | sahip | Team1 WorkshopHub'a kasa adına kayıt |
| `commitHashHesapla(...)`, `muhur(id)`, `pariteler()` | herkes | Okuma |

Kurulum değerleri: pariteler `BTC-USDT`, `ETH-USDT` · `maxTutarCent = 2000` (20 USDT) · `beklemeSn = 300` · `maxGunlukZararCent = 5000` (50 USDT) · `aciklamaPenceresiSn = 10800` (3 saat). Kurucu, denetçinin trader veya sahip olmasını reddeder.

## Test

```bash
forge test        # 29 test (SicilKasasi 28 + SicilPing 1)
```

`test_CommitHash_ViemIleAyni`, zincir dışındaki `agents/shared/commit.mjs` (viem) ile kontratın aynı hash'i ürettiğini `ffi` ile kanıtlar; önce `agents/` içinde `npm install` gerekir.

`SicilPing` yalnızca deploy/verify hattını denemek için kullanılan atılabilir kontrattır.
