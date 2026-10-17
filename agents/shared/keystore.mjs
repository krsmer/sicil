// Foundry keystore'unu (Web3 Secret Storage v3, scrypt + aes-128-ctr) çözer. Özel anahtar sadece bellekte kalır,
// hiçbir yere yazılmaz ve loglanmaz. Keystore ve şifre dosyaları repo dışında: ~/.foundry/keystores/
import { createDecipheriv, scryptSync } from "node:crypto";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { keccak256, toHex } from "viem";

const KEYSTORE_DIR = join(homedir(), ".foundry", "keystores");

export function loadPrivateKey(account) {
  const ks = JSON.parse(readFileSync(join(KEYSTORE_DIR, account), "utf8"));
  const password = readFileSync(join(KEYSTORE_DIR, ".sifreler", `${account}.txt`), "utf8").replace(/\r?\n$/, "");
  const c = ks.crypto ?? ks.Crypto;
  if (c.kdf !== "scrypt" || c.cipher !== "aes-128-ctr") throw new Error(`desteklenmeyen keystore: ${c.kdf}/${c.cipher}`);
  const { n, r, p, dklen, salt } = c.kdfparams;
  const key = scryptSync(password, Buffer.from(salt, "hex"), dklen, { N: n, r, p, maxmem: 256 * n * r });
  const ciphertext = Buffer.from(c.ciphertext, "hex");
  const mac = keccak256(Buffer.concat([key.subarray(16, 32), ciphertext]));
  if (mac.slice(2) !== c.mac.toLowerCase()) throw new Error(`keystore şifresi yanlış: ${account}`);
  const decipher = createDecipheriv("aes-128-ctr", key.subarray(0, 16), Buffer.from(c.cipherparams.iv, "hex"));
  return toHex(Buffer.concat([decipher.update(ciphertext), decipher.final()]));
}
