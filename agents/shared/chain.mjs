// Avalanche Fuji istemcileri ve SicilKasasi erişimi (viem).
import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, http, parseEventLogs } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { avalancheFuji } from "viem/chains";
import { loadPrivateKey } from "./keystore.mjs";

export const SICIL_KASASI = process.env.SICIL_KASASI ?? "0x60735035CC6f4d810f4878f9A4a1993F534fe6a8";
export const KASA_ABI = JSON.parse(readFileSync(new URL("./abi/SicilKasasi.json", import.meta.url), "utf8"));
const RPC = process.env.FUJI_RPC ?? "https://api.avax-test.network/ext/bc/C/rpc";

export const snowtrace = (hash) => `https://testnet.snowtrace.io/tx/${hash}`;

export const publicClient = createPublicClient({ chain: avalancheFuji, transport: http(RPC) });

export function walletFor(keystoreAccount) {
  const account = privateKeyToAccount(loadPrivateKey(keystoreAccount));
  return createWalletClient({ account, chain: avalancheFuji, transport: http(RPC) });
}

export function readKasa(functionName, args = []) {
  return publicClient.readContract({ address: SICIL_KASASI, abi: KASA_ABI, functionName, args });
}

/// Kasaya yazar ve onayı bekler. Revert eden çağrıyı viem simülasyonda yakalar (zincire gitmez).
export async function writeKasa(wallet, functionName, args) {
  const hash = await wallet.writeContract({ address: SICIL_KASASI, abi: KASA_ABI, functionName, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${functionName} başarısız: ${snowtrace(hash)}`);
  const events = parseEventLogs({ abi: KASA_ABI, logs: receipt.logs });
  return { hash, receipt, events };
}
