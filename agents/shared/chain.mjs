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

export const KASA_DEPLOY_BLOGU = 59592241n;

/// SicilKasasi olaylarını okur. Fuji genel RPC'si getLogs'ta en fazla 100 blok kabul eder: 100'lük parçalar, 5'li paralel.
export async function kasaOlaylari(fromBlock, toBlock) {
  const parcalar = [];
  for (let b = fromBlock; b <= toBlock; b += 100n) parcalar.push([b, b + 99n > toBlock ? toBlock : b + 99n]);
  const olaylar = [];
  for (let i = 0; i < parcalar.length; i += 5) {
    const sonuc = await Promise.all(
      parcalar.slice(i, i + 5).map(([f, t]) => publicClient.getContractEvents({ address: SICIL_KASASI, abi: KASA_ABI, fromBlock: f, toBlock: t })),
    );
    olaylar.push(...sonuc.flat());
  }
  return olaylar;
}

/// Ret anı: limit aşan mührü simülasyonsuz ve sabit gas limitiyle gönderir, böylece revert eden işlem zincirde kalır
/// ve Snowtrace'te görünür. (writeContract gas verilmezse önce estimateGas çağırır; revert edecek işlemi hiç göndermez.)
export async function sealRetGoster(wallet, commitHash, pair, notionalCent, gas = 200_000n) {
  const hash = await wallet.writeContract({
    address: SICIL_KASASI, abi: KASA_ABI, functionName: "seal", args: [commitHash, pair, notionalCent], gas,
  });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  return { hash, status: receipt.status, url: snowtrace(hash) };
}

/// Kasaya yazar ve onayı bekler. Revert eden çağrıyı viem simülasyonda yakalar (zincire gitmez).
export async function writeKasa(wallet, functionName, args) {
  const hash = await wallet.writeContract({ address: SICIL_KASASI, abi: KASA_ABI, functionName, args });
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  if (receipt.status !== "success") throw new Error(`${functionName} başarısız: ${snowtrace(hash)}`);
  const events = parseEventLogs({ abi: KASA_ABI, logs: receipt.logs });
  return { hash, receipt, events };
}
