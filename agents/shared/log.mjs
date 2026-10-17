// JSONL log: her adım bir satır. Dosya gitignore'da (agents/logs/).
import { appendFileSync, mkdirSync } from "node:fs";

const DIR = new URL("../logs/", import.meta.url);
mkdirSync(DIR, { recursive: true });
const FILE = new URL(process.env.SICIL_LOG ?? "trader.jsonl", DIR);

export function log(adim, veri = {}) {
  const satir = { ts: new Date().toISOString(), adim, ...veri };
  appendFileSync(FILE, JSON.stringify(satir, (_, v) => (typeof v === "bigint" ? v.toString() : v)) + "\n");
  console.log(`${satir.ts} ${adim}`, JSON.stringify(veri, (_, v) => (typeof v === "bigint" ? v.toString() : v)));
}
