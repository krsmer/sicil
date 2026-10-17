# 01 — OKX Agent Trade Kit (ATK): distilled guide

Source of truth: `ai-docs/sources/okx-atk/` (repo `okx/agent-trade-kit`, v1.4.8, snapshot 15 Oct 2026). Verified locally: `okx-trade-mcp@1.4.8 --modules all` exposes **168 tools**; `--modules market` exposes 21 (20 market + `system_get_capabilities`).

## 1. What it is
- Local toolkit connecting AI agents to an OKX account through OKX REST API v5. MIT, open source, TypeScript, **Node.js ≥ 18**.
- Two binaries (independent, both read `~/.okx/config.toml`):
  - `okx-trade-mcp` — MCP server, **stdio transport only** (no HTTP/hosted mode).
  - `okx` — CLI, `--json` output for scripting.
- Plus **Skills** (`SKILL.md` files) teaching agents how to use the CLI: `ai-docs/sources/okx-atk/skills/`.
- Keys never leave the machine; signing (HMAC-SHA256) is local. Demo mode = header `x-simulated-trading: 1`.
- The shared core library (`@agent-tradekit/core`) is **private / not published**. To use ATK from our own code: MCP client over stdio, or CLI subprocess. See docs/02.

## 2. Install & smoke test
```bash
npm install -g @okx_ai/okx-trade-mcp @okx_ai/okx-trade-cli
okx --version
okx market ticker BTC-USDT            # public, no key needed
okx config init                       # interactive wizard → ~/.okx/config.toml
okx diagnose                          # network / MCP diagnostics
okx list-tools --json                 # machine-readable list of all commands & params
okx-trade-mcp setup --client claude-code   # or claude-desktop | cursor | vscode | windsurf
```
Skills install (optional): `npx skills add okx/agent-skills`.

## 3. Config (`~/.okx/config.toml`)
Template: `ai-docs/templates/okx-config.example.toml`.
```toml
default_profile = "demo"

[profiles.demo]
site       = "tr"        # OKX TR account → tr.okx.com. Use "global" for www.okx.com accounts
api_key    = "..."
secret_key = "..."
passphrase = "..."
demo       = true        # simulated trading, no real money

[profiles.live]
site       = "tr"
api_key    = "..."
secret_key = "..."
passphrase = "..."
```
- Keys: `api_key`, `secret_key`, `passphrase`, `demo`, `site` (`global | eea | us | tr`), `proxy_url` (HTTP/HTTPS only), `base_url` (overrides site).
- Site priority: `--site` flag → `OKX_SITE` env → profile `site` → OAuth login site → `global`. Also `OKX_API_BASE_URL`.
- **Demo keys are separate from live keys**: OKX → Trading → Demo Trading → API Management (TR: on tr.okx.com).
- Permissions: **Read + Trade**. Never Withdraw. Bind IP if possible; use a sub-account for live.
- Passphrase with `# \ " '`: quote carefully (single quotes for `# \ "`, double for `'`, triple single quotes for both) or the server fails to start with a parse error.
- Alternative auth: OAuth (`okx auth login --site tr`); then use `--demo` instead of profiles. API-key profiles take precedence over OAuth. See `skills/okx-cex-auth/SKILL.md`.
- Smart registration: if the key lacks Trade permission, order tools are hidden from the agent.

### ⚠ TR site caveats (from `sources/okx-atk/docs/site-compatibility.md`, `docs/modules/news.md`)
- TR (`tr.okx.com`) is "newly added": demo trading, public and private endpoints are **"not yet tested"** by OKX.
- `news` module: "Site support: Global (EEA/US pending)". It may not work on TR.
- **Action:** run a smoke test on the actual TR keys before 17 Oct (ticker, balance, one demo order, `news_get_latest`). Keep a fallback: a `global` demo profile, or degrade gracefully when a module errors.

## 4. Running the MCP server
```bash
okx-trade-mcp                                  # default modules: spot, swap, account
okx-trade-mcp --modules market                 # public data only, no key
okx-trade-mcp --profile demo --modules all     # demo, every module (168 tools)
okx-trade-mcp --profile live --read-only       # live, query tools only
okx-trade-mcp --profile live --modules market,spot
```
Flags: `--profile`, `--modules <list|all>`, `--site`, `--read-only`, `--no-log` (audit log in `~/.okx/logs/`), `--log-level debug|info|warn|error`.
- One profile per server process. To have demo and live side by side, register two servers (`okx-demo`, `okx-live`).
- **Cursor limits ~40 tools/server, ~80 total**: `--modules all` breaks Cursor. Pick modules.
- For our own agent, load only the modules it needs: fewer tools means better LLM tool choice and fewer tokens.

## 5. Modules (tool counts from the live listTools dump)
| Module (`--modules` id) | Tools | Auth | Highlights |
|---|---|---|---|
| `market` | 20 | none | ticker(s), orderbook, candles (auto-history back to 2021, default 100 per call, paginate with `after`), funding rate (+history), mark price, OI (+history, OI-change filter), trades, index, price limit, **`market_get_indicator` (70+ indicators: MA/EMA/RSI/MACD/BB/ATR/KDJ/BTCRAINBOW/AHR999…)**, `market_list_indicators`, **`market_filter`** (screen by price/change/mcap/volume/funding/OI), `market_get_pair_spread` |
| `spot` | 14 | Trade | place/cancel/amend, batch (≤20), fills, history, conditional & OCO algo orders |
| `swap` | 17 | Trade | perpetuals: place, close position, positions, leverage, algo (conditional/OCO/trailing stop) |
| `futures` | 18 | Trade | delivery contracts, same shape as swap |
| `option` | 14 | Trade | orders, positions with Greeks, option chain, IV |
| `account` | 14 | Read | balance, positions (+history), bills, fee rates, config, position mode, max size / max avail size (fee rates tool: `account_get_trade_fee`). Tool-call audit log: **`trade_get_history`** (module `trade`; there is no `account_get_audit_log`) |
| `event` | 9 | Trade | event (binary outcome) contracts: UP/YES/DOWN/NO |
| `news` | 9 | Read | latest, by coin, full-text search, article detail, domains, **coin sentiment + sentiment ranking**, economic calendar |
| `smartmoney` | 10 | Read | trader leaderboard, trader performance/positions/history, **consensus signals by coin / by traders**, signal history |
| `bot` (`bot.grid`, `bot.dca`) | 9 + 5 | Trade | grid and DCA bots, spot & contract. Grid bot in demo mode: unverified (the official `okx-cex-bot` skill shows `okx --demo bot grid create`; test before relying on it). |
| `earn` (`earn.savings`, `earn.onchain`, `earn.dcd`, `earn.flash`) | 12+6+6+… | Trade | Simple Earn, on-chain staking, dual currency |
| always on | 1 | — | `system_get_capabilities` (what's loaded, auth, demo, read-only) |

Full parameter tables: `ai-docs/sources/okx-atk/TOOL_CATALOG.md` (grep by tool name). Module docs: `ai-docs/sources/okx-atk/docs/modules/*.md`.
Not supported at all: deposits/withdrawals/transfers (Asset), Convert, sub-account management, copy/spread/block trading, recurring buy.

## 6. Key tools for an autonomous trading agent
| Need | MCP tool | CLI |
|---|---|---|
| Price | `market_get_ticker {instId}` | `okx market ticker BTC-USDT` |
| Candles | `market_get_candles {instId, bar, limit}` | `okx market candles BTC-USDT --bar 1H --limit 200` |
| Indicator | `market_get_indicator {instId, indicator:"rsi", bar:"1H", params:[14]}` (call `market_list_indicators` first; unknown names return empty data silently) | `okx market indicator list` (see `skills/okx-cex-market/references/indicator-commands.md`) |
| Funding / OI | `market_get_funding_rate`, `market_get_open_interest` | `okx market funding-rate BTC-USDT-SWAP` |
| Contract size | `market_get_instruments {instType:"SWAP", instId}` → `ctVal`, `minSz`, `lotSz` | `okx market instruments --instType SWAP` |
| Balance | `account_get_balance` | `okx account balance --json` |
| Max order size | `account_get_max_size` / `account_get_max_avail_size` | — |
| Spot order | `spot_place_order {instId, tdMode:"cash", side, ordType, sz, px?}` | `okx spot place --instId BTC-USDT --side buy --ordType market --sz 100` |
| Perp order with TP/SL | `swap_place_order {instId, tdMode, side, ordType, sz, tpTriggerPx?, slTriggerPx?}` | `okx swap place --instId BTC-USDT-SWAP --side buy --ordType market --sz 1 --tdMode cross` |
| Leverage | `swap_set_leverage` | — |
| Close | `swap_close_position` | — |
| Stop / trailing | `swap_place_algo_order` | `okx swap algo place …` |
| News & sentiment | `news_get_latest`, `news_get_by_coin`, `news_get_coin_sentiment`, `news_get_sentiment_ranking`, `news_get_economic_calendar` | `okx news …` |
| Smart money | `smartmoney_get_signal_overview_*`, `smartmoney_get_traders_by_filter` | `okx smartmoney …` |
| What did the agent do | `trade_get_history` (local audit log of MCP tool calls; for exchange fills use `spot_get_fills` / `swap_get_fills`) | — |

Sizing gotchas (from tool descriptions):
- Spot `sz`: **market buy = quote amount (USDT)**, everything else = base amount (BTC); `tgtCcy` overrides. `tdMode: "cash"` for plain spot.
- SWAP `sz` = number of contracts, each = `ctVal` units. Or `tgtCcy: "quote_ccy"` (USDT notional) / `"margin"` (margin cost; notional = sz × leverage).
- `posSide` only in hedge mode (`long`/`short`); one-way mode is `net` (default).
- All numeric params are **strings** (`"sz": "0.01"`).

## 7. Errors
- **MCP:** a failed call still returns content; the text is JSON with `"error": true`, `type` (`OkxApiError`, `NetworkError`, …), `code`, `message`, `suggestion`, `endpoint`, `traceId`, plus a `capabilities` snapshot. Parse it and feed `suggestion` back to the LLM or the retry logic.
- **CLI:** exit code `1` on any failure; stderr has `Error`, `TraceId`, `Hint`. Batch: exit 1 if any item `sCode != "0"`; inspect JSON per item.
- Common: `51020` invalid quantity (check `minSz/lotSz/ctVal`), insufficient balance, 401/signature error (wrong key/site/demo mismatch: demo key needs `demo = true`).
- Built-in rate limiter (token bucket); still keep loop intervals ≥ several seconds.

## 8. Safety switches to show judges
- `demo` profile vs `live` profile; `--read-only`; `--modules` least privilege; `[CAUTION]` tagged write tools; audit log `~/.okx/logs/` + `trade_get_history`; no withdraw capability.
- Our own risk gate on top (docs/02 §4).

## 9. Official Skills (read before designing flows)
`okx-cex-market`, `okx-cex-trade`, `okx-cex-portfolio`, `okx-cex-bot`, `okx-cex-earn`, `okx-cex-smartmoney`, `okx-cex-auth`, `okx-sentiment-tracker`, `earn-hunter`, `okx-cex-skill-mp`. Each has `SKILL.md` + `references/*-commands.md` (CLI↔MCP mapping) + `references/workflows.md` (OKX's recommended multi-step flows). They can be dropped into `.claude/skills/` so Claude Code can operate the CLI directly while developing.

## 10. Links
Repo https://github.com/okx/agent-trade-kit · Docs https://www.okx.com/docs-v5/agent_en/ · Product https://www.okx.com/en-us/agent-tradekit · Skills https://github.com/okx/agent-skills · DeepWiki https://deepwiki.com/okx/agent-trade-kit · OKX API v5 https://www.okx.com/docs-v5/en/ · Telegram https://t.me/OKX_AgentKit
