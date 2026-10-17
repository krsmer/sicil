// SİCİL mühür hash'i (zincir dışı). SicilKasasi.commitHashHesapla ile birebir aynı olmalı:
// keccak256(abi.encode(pair, side, priceE8, sizeE8, thesis, confidence, salt))
import { pathToFileURL } from "node:url";
import { encodeAbiParameters, keccak256 } from "viem";

export const COMMIT_ABI = [
  { type: "string", name: "pair" },
  { type: "uint8", name: "side" }, // 0 = al, 1 = sat
  { type: "uint256", name: "priceE8" },
  { type: "uint256", name: "sizeE8" },
  { type: "string", name: "thesis" },
  { type: "uint8", name: "confidence" }, // 0-100
  { type: "bytes32", name: "salt" },
];

export function commitHash({ pair, side, priceE8, sizeE8, thesis, confidence, salt }) {
  return keccak256(
    encodeAbiParameters(COMMIT_ABI, [pair, side, BigInt(priceE8), BigInt(sizeE8), thesis, confidence, salt]),
  );
}

// CLI (Foundry ffi testi bunu çağırır):
// node commit.mjs <pair> <side> <priceE8> <sizeE8> <thesis> <confidence> <salt>
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [pair, side, priceE8, sizeE8, thesis, confidence, salt] = process.argv.slice(2);
  process.stdout.write(commitHash({ pair, side: Number(side), priceE8, sizeE8, thesis, confidence: Number(confidence), salt }));
}
