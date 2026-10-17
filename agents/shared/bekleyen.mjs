// "Bekleyen açılışlar": seal'den ÖNCE, açılış (reveal) için gereken her şey (salt, fiyat, miktar, tez, güven) yerel bir
// dosyaya yazılır. Ajan çökerse açılışta bu dosyadan 3 saatlik pencere içindeki açılmamış mühürleri açar; böylece çökme
// "açılmamış mühür = tutmadı, güven 100" cezasına dönüşmez. Dosya agents/logs/ altında (gitignore'da); salt açılıştan
// önce gizli kalmalıdır.
import { existsSync, readFileSync, renameSync, writeFileSync } from "node:fs";

const VARSAYILAN = new URL("../logs/bekleyen-acilislar.json", import.meta.url);

export function bekleyenDeposu(dosya = process.env.SICIL_BEKLEYEN ? new URL(`file://${process.env.SICIL_BEKLEYEN}`) : VARSAYILAN) {
  const oku = () => (existsSync(dosya) ? JSON.parse(readFileSync(dosya, "utf8")) : []);
  const yaz = (liste) => {
    const gecici = new URL(`${dosya.href}.tmp`);
    writeFileSync(gecici, JSON.stringify(liste, null, 1));
    renameSync(gecici, dosya); // atomik: yarım yazılmış dosya kalmaz
  };
  return {
    liste: oku,
    ekle(kayit) {
      yaz([...oku().filter((k) => k.commitHash !== kayit.commitHash), kayit]);
    },
    guncelle(commitHash, alanlar) {
      yaz(oku().map((k) => (k.commitHash === commitHash ? { ...k, ...alanlar } : k)));
    },
    sil(commitHash) {
      yaz(oku().filter((k) => k.commitHash !== commitHash));
    },
  };
}
