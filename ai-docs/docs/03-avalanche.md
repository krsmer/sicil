# 03 — Avalanche for this project (Bonus 2: "deploy on Avalanche")

Sources: `ai-docs/sources/avalanche/` (copied from `ava-labs/builders-hub`, the code behind https://build.avax.network, snapshot 15 Oct 2026). For anything not here, use the Avalanche docs MCP (docs/04).

The organisers did not define what "deploy on Avalanche" means. Safest reading: **a smart contract the agent actually uses, deployed on Avalanche C-Chain (Fuji testnet is fine for a demo), visible on the explorer.** Optional extras below (x402 payments, agent wallet, oracles) make the integration less superficial.

## 1. Network parameters (verified: viem `avalancheFuji` + builders-hub docs)
| | Fuji testnet | Mainnet C-Chain |
|---|---|---|
| chainId | **43113** | 43114 |
| RPC (HTTP) | `https://api.avax-test.network/ext/bc/C/rpc` | `https://api.avax.network/ext/bc/C/rpc` |
| WebSocket | `wss://api.avax-test.network/ext/bc/C/ws` | `wss://api.avax.network/ext/bc/C/ws` |
| Explorer | https://testnet.snowtrace.io (also Builder Hub explorer) | https://snowtrace.io |
| Gas token | AVAX (test) | AVAX |
| USDC | `0x5425890298aed601595a70AB815c96711a31Bc65` | `0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E` |
| Other | — | USDT `0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7`, WAVAX `0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7` |

Faucets: Builder Hub console https://build.avax.network/console/primary-network/faucet (login + connected wallet) · Core faucet https://core.app/tools/testnet-faucet/?token=c (coupon `avalanche-academy`) · test USDC https://faucet.circle.com (select Avalanche Fuji). **Get test AVAX before 17 Oct**; faucets can be rate-limited.
Use the **C-Chain 0x… address**, not X/P-chain (`fuji…`/`avax…`) addresses.

## 2. The one Avalanche gotcha: EVM version
Avalanche C-Chain supports **Cancun**, not Pectra. Solidity ≥ 0.8.30 defaults to Pectra → deploy may fail or behave oddly. Always set:
- Foundry: `evm_version = "cancun"` in `foundry.toml`
- Hardhat: `solidity.settings.evmVersion = "cancun"`
- solc-js / Remix: EVM version = cancun
Also: no EIP-7702 (set-code) transactions on C-Chain.

## 3. Foundry flow (recommended)
Template: `ai-docs/templates/foundry.toml`.
```bash
curl -L https://foundry.paradigm.xyz | bash && foundryup
forge init contracts && cd contracts           # put AgentDecisionLog.sol in src/
# .env (gitignored): PRIVATE_KEY=0x...   (a fresh hackathon-only key, funded from the faucet)
forge build
forge create src/AgentDecisionLog.sol:AgentDecisionLog \
  --rpc-url fuji --private-key $PRIVATE_KEY --broadcast \
  --constructor-args 0x0000000000000000000000000000000000000000
# write
cast send <ADDR> "setPolicy(bytes32,string)" <POLICY_HASH> "ipfs://or-text" --rpc-url fuji --private-key $PRIVATE_KEY
# read
cast call <ADDR> "policyHash()(bytes32)" --rpc-url fuji
cast keccak "$(cat policy.json)"               # hash helper
```
Newer Foundry versions need `--broadcast` on `forge create` to actually send; without it it is a dry run.

## 4. Contract template
`ai-docs/templates/AgentDecisionLog.sol` (compiled OK with solc 0.8.24, evmVersion cancun, optimizer 200):
- `setPolicy(bytes32 policyHash, string policyURI)` — owner stores the hash of the user-approved policy.
- `logDecision(Verdict verdict, string instId, bytes32 payloadHash, string okxOrderId)` — agent emits one event per decision (Allow / Shrink / Reject).
- Events are cheap and show up on Snowtrace; full payload stays off-chain (JSONL), only its keccak256 goes on-chain, so anyone can verify a log line against the chain.

## 5. Calling the contract from the agent (viem, TypeScript)
```js
import { createWalletClient, createPublicClient, http, keccak256, toHex } from "viem";
import { avalancheFuji } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

const account = privateKeyToAccount(process.env.PRIVATE_KEY);
const wallet  = createWalletClient({ account, chain: avalancheFuji, transport: http() });
const pub     = createPublicClient({ chain: avalancheFuji, transport: http() });
const abi = [{ type: "function", name: "logDecision", stateMutability: "nonpayable",
  inputs: [{ type: "uint8" }, { type: "string" }, { type: "bytes32" }, { type: "string" }], outputs: [{ type: "uint256" }] }];

const payloadHash = keccak256(toHex(JSON.stringify(entry)));
const hash = await wallet.writeContract({ address: LOG_ADDR, abi, functionName: "logDecision",
  args: [1 /* Shrink */, "BTC-USDT", payloadHash, orderId ?? ""] });
await pub.waitForTransactionReceipt({ hash });
console.log(`https://testnet.snowtrace.io/tx/${hash}`);
```
Python: `web3.py` with `Web3(Web3.HTTPProvider("https://api.avax-test.network/ext/bc/C/rpc"))`, chainId 43113.
Write on-chain asynchronously (queue) so a slow RPC never blocks the trading loop. Finality is ~1–2 s on C-Chain.

## 6. Verify the contract (makes the demo credible)
- Builder Hub verifier (no API key), Foundry: `forge verify-contract --chain-id 43113 --verifier sourcify --verifier-url https://build.avax.network/api/verify/sourcify <ADDR> src/AgentDecisionLog.sol:AgentDecisionLog` (docs show 43114; same endpoints take the Fuji chain id — confirm via docs MCP if it fails).
- Or explorer UI: Contract tab → Verify → upload `out/build-info/*.json` (`forge build --build-info`).
- Snowtrace API (Hardhat flow): `https://api-testnet.snowtrace.io/api?module=contract&action=verifysourcecode`.
- Must match compiler version, optimizer runs and evm version exactly. Details: `sources/avalanche/docs_tooling_contract-verification_index.md`, `…verify-contract_snowtrace.md`, `…verify-contract_hardhat.md`.

## 7. Hardhat alternative
Network config (from builders-hub): `fuji: { url: "https://api.avax-test.network/ext/bc/C/rpc", chainId: 43113, accounts: [PRIVATE_KEY] }`, `solidity: { version: "0.8.30", settings: { evmVersion: "cancun", optimizer: { enabled: true, runs: 200 } } }`. Verify: `npx hardhat verify --network fuji <ADDR> <args>`.

## 8. Ways to make Avalanche more than a logbook (optional, pick one)
- **x402 payments (agent pays for data/services in USDC):** Avalanche Academy has a full x402 course (`sources/avalanche/x402-course/`). Facilitators on Avalanche: thirdweb, PayAI (`x402-express`, `x402-client`), Ultravioleta DAO (gasless). Network strings `"avalanche"` / `"avalanche-fuji"`. Pattern from the course: a dedicated **agent wallet** with a capped budget, funded from the user's wallet, withdrawable.
- **Agent wallet with on-chain budget/guardrail:** the contract holds the policy hash and the agent's allowance; the risk gate refuses to act if the on-chain policy hash ≠ local policy hash.
- **Oracles:** Chainlink Data Feeds / Pyth on Avalanche (`sources/avalanche/integrations_chainlink-data-feeds.md`, `integrations_pyth.md`) to cross-check OKX prices on-chain.
- **0xGasless AgentKit** (x402 facilitator + on-chain agent execution): `sources/avalanche/integrations_0xgasless.md`.
- **Data API** (indexed balances, txs, logs; key from Builder Hub console): `https://data-api.avax.network/v1/chains/43113/...` with header `x-glacier-api-key`. Handy for the dashboard (list the agent's on-chain events without running an indexer).

## 9. Hackathon NFT
Soulbound commemorative NFT on C-Chain mainnet `0x38f27871C2feddb06759E392fba317CDfe511149` (page: https://agentichackathon.team1.network/tr/nft-mint). Needs a little real AVAX for gas; agents may mint too.

## 10. Links
Builder Hub docs https://build.avax.network/docs · llms.txt https://build.avax.network/llms.txt · full dump https://build.avax.network/llms-full.txt · any page as markdown: append `.md` · Docs MCP https://build.avax.network/api/mcp · Academy (Solidity/Foundry, x402) https://build.avax.network/academy · Starter kit https://github.com/ava-labs/avalanche-starter-kit · Foundry book https://book.getfoundry.sh
