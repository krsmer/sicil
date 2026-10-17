# AGENTS.md — read this first

> Repo-root instructions for every AI coding agent (Claude Code loads it through `CLAUDE.md`; Cursor, Codex and Copilot read `AGENTS.md`). All paths are relative to the repo root. Reference material lives in `ai-docs/`.

You are coding an entry for the **Agentic Hackathon (OKX TR × Team1 Türkiye, Avalanche ecosystem partner), Ankara, 17 Oct 2026**.
Build window is ~9 hours (10:00–19:00). **The project is decided: SİCİL** (see `memory-bank/`).

## Start here: memory bank
At the start of every session read `memory-bank/` in this order: `projectBrief.md` → `productContext.md` → `systemPatterns.md` → `techContext.md` → `activeContext.md` → `progress.md` (plus `demoScript.md` for presentation work and `decisionLog.md` for "why" questions). After finishing a task, update `activeContext.md` and `progress.md`. Do not reopen decisions in `decisionLog.md` without asking a human. Rules: `memory-bank/README.md`. Where the memory bank and `ai-docs/docs/` disagree about SİCİL, the memory bank wins; for ATK/Avalanche facts, `ai-docs/sources/` and live MCP win.

Your training data almost certainly does **not** know the OKX Agent Trade Kit (ATK) and may be stale on Avalanche.
**Do not guess tool names, CLI flags, chain params or config keys. Look them up in this folder or via the live MCP servers below.**

## Mission (from the organisers)
- **Required:** an *autonomous* AI agent that works through **OKX Agent Trade Kit**.
- **Bonus 1:** turn it into a trading agent tested in real market conditions with ATK.
- **Bonus 2:** deploy the agent / product on **Avalanche**.
- Judging: agent architecture & autonomy **35%**, product & strategy 25%, technical quality 20%, demo & presentation 20%, bonuses extra.
- Details: [docs/05-hackathon-context.md](ai-docs/docs/05-hackathon-context.md)

## Reading order
| When you need… | Read |
|---|---|
| What ATK is, install, config, profiles, demo vs live, modules, safety | [docs/01-okx-atk.md](ai-docs/docs/01-okx-atk.md) |
| How *our own agent code* calls ATK (MCP client, CLI subprocess), the autonomous loop, risk gate | [docs/02-agent-integration.md](ai-docs/docs/02-agent-integration.md) |
| Avalanche C-Chain / Fuji: params, Foundry/Hardhat, deploy, verify, viem, faucet, x402 | [docs/03-avalanche.md](ai-docs/docs/03-avalanche.md) |
| Live doc access during coding (Avalanche docs MCP, OKX MCP, llms.txt) | [docs/04-live-docs-mcp.md](ai-docs/docs/04-live-docs-mcp.md) |
| Exact parameters of any of the 168 ATK MCP tools | [sources/okx-atk/TOOL_CATALOG.md](ai-docs/sources/okx-atk/TOOL_CATALOG.md) (grep it, don't read it whole) |
| Exact CLI syntax | [sources/okx-atk/docs/cli-reference.md](ai-docs/sources/okx-atk/docs/cli-reference.md) + `ai-docs/sources/okx-atk/skills/okx-cex-*/references/*-commands.md` |
| Per-module behaviour | `ai-docs/sources/okx-atk/docs/modules/<module>.md` |
| Official OKX agent workflows (how OKX expects the tools to be used) | `ai-docs/sources/okx-atk/skills/*/SKILL.md` |
| Avalanche originals (verification, Data API, x402 course, integrations) | `ai-docs/sources/avalanche/` |
| Hackathon notes (Turkish): rules, schedule, past winners, idea candidates | [ai-docs/hackathon/HACKATHON_BILGI.md](ai-docs/hackathon/HACKATHON_BILGI.md), [ai-docs/hackathon/ODULLU_PROJELER.md](ai-docs/hackathon/ODULLU_PROJELER.md) |
| Ready-to-copy files | `ai-docs/templates/` (`.mcp.json`, `foundry.toml`, `AgentDecisionLog.sol`, `agent-skeleton.mjs`, `okx-config.example.toml`, `gitignore`). `.mcp.json` and `.gitignore` are already copied to the repo root. |

`ai-docs/sources/` are verbatim copies of official docs (snapshot 15 Oct 2026, see each `SOURCE_VERSION.txt`). `ai-docs/docs/` are distilled guides written for you; when they disagree, **sources and live MCP win**. Refresh with `ai-docs/scripts/sync-sources.sh`.

## Hard rules
1. **Demo first.** Every ATK call that can move money runs with the `demo` profile (`--profile demo`) until a human explicitly says live. Never enable Withdraw permissions; ATK cannot withdraw anyway.
2. **Never commit secrets.** API keys live in `~/.okx/config.toml` (outside the repo). Avalanche wallets are encrypted Foundry keystores in `~/.foundry/keystores/` (outside the repo); if a raw key is ever needed it goes in `.env` (gitignored). Never print them in logs.
3. **MCP tool names use underscores** (`swap_place_algo_order`); **CLI uses spaces** (`okx swap algo place`). Never convert one into a hyphenated CLI command.
4. **Risk rules are code, not prompts.** The LLM proposes; a deterministic risk gate in code allows / shrinks / rejects before any order tool is called.
5. **Avalanche Solidity:** always compile with `evm_version = "cancun"` (C-Chain does not support Pectra opcodes; solc ≥0.8.30 defaults to Pectra).
6. **Instrument IDs:** spot `BTC-USDT`, perpetual `BTC-USDT-SWAP`, futures `BTC-USD-250328`. For SWAP sizes, query `market_get_instruments` for `ctVal`; never assume contract size.
7. **OKX TR account → `site = "tr"`** (`https://tr.okx.com`). ATK marks TR demo-trading and several modules (e.g. `news`) as *not yet tested / pending* — verify early, keep a fallback (global demo profile or market-only data).
8. Before inventing a capability, check if ATK already has it (`system_get_capabilities`, `okx list-tools --json`, TOOL_CATALOG.md). Judges reward creative use of ATK's own modules (indicators, funding, smartmoney, news, algo orders, bots).
9. If something is not in these docs, query the live MCP servers (ai-docs/docs/04-live-docs-mcp.md) or say you don't know. Do not fabricate.

## Default architecture (generic; SİCİL's actual architecture is in `memory-bank/systemPatterns.md`)
```
ATK read tools (market / news / smartmoney / account)
        → LLM analysis (structured JSON decision)
        → risk gate in code (policy.json limits)  ──reject──┐
        → ATK order tools (demo profile)                    │
        → decision log (JSONL) + Avalanche Fuji event  ◄────┘
        → live dashboard (what the agent saw, decided, why)
```
Loop runs on a timer without human input; a human can only pause / change policy.

## Project-specific notes
**SİCİL** — an autonomous AI trading agent on **OKX TR spot** (no leverage: Turkish SPK rules) that seals every decision and its falsifiable thesis on **Avalanche Fuji before** the order is sent, plus an independent, LLM-free **auditor agent** that matches *every* fill on the account against the seals, scores the theses, and writes the verdict to the `SicilKasasi` contract and the official **ERC-8004** registries. One unsealed trade permanently marks the record as broken (`SicilBozuldu`). B plan at 14:00: ANAYASA (same contract and executor, limit gate + Turkish rules + jury brake).

SİCİL-specific hard rules (in addition to the ones above):
- **No order without a confirmed `Sealed` event.** `clOrdId` = `sicil` + 6-digit seal id (alphanumeric, ≤ 32 chars).
- **The LLM never touches write tools.** It talks to a separate `okx-trade-mcp --read-only` process; only executor code calls `spot_place_order` / `spot_place_algo_order`. The LLM may only shrink size, never grow it; no order without a stop.
- **The auditor uses no LLM** and a read-only OKX key. It only scans fills after `sicilBaslangic`; a seal whose time has expired without `reveal` counts as a failed thesis.
- The `okx-demo` MCP server in `.mcp.json` is `--read-only`: during development never place orders through it (they would pollute the record).
- Wallet keystores live in `~/.foundry/keystores/` (accounts `sicil-sahip`, `sicil-trader`, `sicil-denetci`, `sicil-fren`), passwords in `~/.foundry/keystores/.sifreler/`. Never copy them into the repo, never print them.
- Known wrong names in older docs: there is **no** `account_get_audit_log` (use `trade_get_history`, a local tool-call log) and **no** `account_get_fee_rates` (use `account_get_trade_fee`). Full list: `memory-bank/techContext.md` §4.

Stack, run commands and demo script: `memory-bank/techContext.md`, `memory-bank/demoScript.md`. Fill in the exact run command here once the code exists.
