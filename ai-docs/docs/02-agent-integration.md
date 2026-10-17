# 02 — Calling ATK from our own agent + autonomous loop design

ATK has no public SDK (`@agent-tradekit/core` is private). Three supported ways for our code to use it:

| Option | How | Use when |
|---|---|---|
| **A. MCP client over stdio** (recommended) | spawn `okx-trade-mcp`, `listTools`, `callTool` | Our agent is Node/Python and the LLM should see ATK tools natively |
| **B. CLI subprocess** | `okx … --json`, parse stdout, check exit code | Quick scripts, Python without MCP, deterministic steps (no LLM choice) |
| **C. Agent framework with MCP support** | Claude Agent SDK, OpenAI Agents SDK, LangGraph MCP adapters, etc. register `okx-trade-mcp` as an stdio server | We want the framework to run the tool loop |

All options use the same `~/.okx/config.toml` profiles. Choose the profile at spawn time (`--profile demo`).

## A. MCP client (TypeScript) — tested against okx-trade-mcp@1.4.8
```js
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const okx = new Client({ name: "hackathon-agent", version: "0.1.0" });
await okx.connect(new StdioClientTransport({
  command: "okx-trade-mcp",
  args: ["--profile", "demo", "--modules", "market,spot,swap,account,news,smartmoney"],
}));
const { tools } = await okx.listTools();          // [{ name, title, description, inputSchema, annotations }]
const res = await okx.callTool({ name: "market_get_ticker", arguments: { instId: "BTC-USDT" } });
const data = JSON.parse(res.content[0].text);     // errors also arrive here as {"error": true, ...}
```
- Startup takes a few seconds; spawn once and reuse the client.
- `annotations.readOnlyHint` tells read vs write tools apart: use it to route write tools through the risk gate.
- Full runnable loop: `ai-docs/templates/agent-skeleton.mjs` (connect → observe → decide stub → gate → order → JSONL log). Verified to connect and handle errors.

### Python equivalent (`pip install mcp`)
```python
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

params = StdioServerParameters(command="okx-trade-mcp", args=["--profile", "demo", "--modules", "market,spot,account"])
async with stdio_client(params) as (read, write):
    async with ClientSession(read, write) as s:
        await s.initialize()
        tools = (await s.list_tools()).tools
        r = await s.call_tool("market_get_ticker", {"instId": "BTC-USDT"})
        text = r.content[0].text   # JSON string
```

### Handing ATK tools to an LLM (any provider)
MCP `inputSchema` is JSON Schema, which every function-calling API accepts. Map each MCP tool to the provider's tool format (`name`, `description`, `input_schema`/`parameters` = `inputSchema`), let the model emit a tool call, execute it with `okx.callTool`, return the text result. Only expose the tools the agent needs; keep **write tools out of the LLM's reach** and call them from code after the risk gate (pattern below). For Claude, use the current model ids and API shapes from the `claude-api` skill / https://docs.claude.com — do not rely on memory.

## B. CLI subprocess
```python
import json, subprocess
def okx(*args):
    p = subprocess.run(["okx", "--profile", "demo", *args, "--json"], capture_output=True, text=True)
    if p.returncode != 0:
        raise RuntimeError(p.stderr)          # contains Error / TraceId / Hint
    return json.loads(p.stdout)

ticker  = okx("market", "ticker", "BTC-USDT")
candles = okx("market", "candles", "BTC-USDT", "--bar", "1H", "--limit", "200")
bal     = okx("account", "balance")
```
CLI syntax per module: `ai-docs/sources/okx-atk/skills/okx-cex-*/references/*-commands.md`. Discover everything: `okx list-tools --json`. Global flags: `--profile`, `--demo`, `--live`, `--json`, `--env`, `--verbose`.

## C. Claude Code / Agent SDKs
`.mcp.json` in the repo root (template `ai-docs/templates/.mcp.json`) registers `okx-trade-mcp` for Claude Code while we develop, so the coding AI can query real market data and the demo account. Agent frameworks take the same stdio command + args. Tool names appear namespaced, e.g. `mcp__okx-demo__market_get_ticker` in Claude Code.

## The autonomous loop (what scores the 35%)
```
every N seconds (no human in the loop):
  1. OBSERVE   market_get_candles / market_get_indicator / market_get_funding_rate
               news_get_latest / news_get_coin_sentiment  (may be unsupported on TR: degrade gracefully)
               smartmoney_get_signal_overview_*            (consensus of top traders)
               account_get_balance / account_get_positions
  2. DECIDE    LLM gets observation + current positions + policy → strict JSON:
               {action, instId, side, size_usdt, leverage, tp, sl, confidence, reason}
               (validate against a schema; on invalid JSON → hold)
  3. GATE      deterministic code checks policy.json → allow | shrink | reject (+why)
               checks: allowed instruments, max order size, max leverage, max daily loss,
               max open positions, cooldown, confidence threshold, kill switch
               use account_get_max_size and market_get_instruments (ctVal/minSz/lotSz) to size correctly
  4. ACT       spot_place_order / swap_place_order with tpTriggerPx/slTriggerPx, or swap_place_algo_order
               always profile=demo until a human flips it
  5. RECORD    append JSONL {obs summary, decision, gate verdict, order id, result}
               keccak256(entry) → AgentDecisionLog.logDecision on Avalanche Fuji (docs/03)
  6. MONITOR   positions / PnL; protective actions (tighten stop, reduce, close) are also gated
```
Design notes:
- Separate **planner** (LLM) from **executor** (code). The LLM never holds the keys to write tools.
- Make every decision explainable on the dashboard: input snapshot → reasoning → gate verdict → order → on-chain tx link.
- Persist state (positions opened by the agent, daily PnL, counters) so a restart doesn't break limits.
- Add a kill switch (file flag or UI button) and a `--read-only` mode for the demo rehearsal.
- Time budget: LLM calls are the slowest step; one decision per 1–5 min is plenty for a demo. Pre-record a fallback video in case venue Wi-Fi fails.

## Policy file shape (suggested)
```json
{
  "version": 1,
  "allowedInst": ["BTC-USDT", "ETH-USDT", "BTC-USDT-SWAP"],
  "maxOrderUsdt": 50,
  "maxLeverage": 3,
  "maxDailyLossPct": 5,
  "maxOpenPositions": 2,
  "cooldownSec": 300,
  "minConfidence": 0.6,
  "requireStopLoss": true
}
```
Canonicalise (sorted keys, no whitespace) before hashing so the on-chain `policyHash` is reproducible.
