// agent-skeleton.mjs — minimal autonomous loop: ATK (MCP stdio) → decide → risk gate → order (demo) → log.
// Template only. The LLM step is a stub (`decide`) so this file runs without any model key.
// Run: npm i @modelcontextprotocol/sdk && node agent-skeleton.mjs
// Needs: okx-trade-mcp installed (npm i -g @okx_ai/okx-trade-mcp) and a `demo` profile in ~/.okx/config.toml
// (for market-only dry runs set MODULES=market and DRY_RUN=1).
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { appendFileSync } from "node:fs";

const PROFILE = process.env.OKX_PROFILE ?? "demo";          // never "live" without an explicit human decision
const MODULES = process.env.MODULES ?? "market,spot,account";
const DRY_RUN = process.env.DRY_RUN === "1";
const INST = process.env.INST ?? "BTC-USDT";
const INTERVAL_MS = Number(process.env.INTERVAL_MS ?? 60_000);

// Policy = deterministic limits. In the real project load from policy.json and hash it (keccak256) for Avalanche.
const policy = { maxOrderUsdt: 50, allowedInst: ["BTC-USDT", "ETH-USDT"], maxOrdersPerHour: 6 };

const args = ["--profile", PROFILE, "--modules", MODULES];
const okx = new Client({ name: "hackathon-agent", version: "0.1.0" });
await okx.connect(new StdioClientTransport({ command: "okx-trade-mcp", args }));
const { tools } = await okx.listTools();
console.log(`connected: ${tools.length} tools (${MODULES})`);

// ATK returns errors as JSON text with "error": true instead of throwing. Normalise both cases.
async function call(name, args = {}) {
  const res = await okx.callTool({ name, arguments: args });
  const text = res.content?.find((c) => c.type === "text")?.text ?? "";
  let data; try { data = JSON.parse(text); } catch { data = text; }
  if (res.isError || data?.error) throw Object.assign(new Error(data?.message ?? text), { okx: data });
  return data;
}

// --- LLM step (replace): give the model the observation + policy, require a JSON decision. ---
async function decide(obs) {
  // e.g. { action: "buy" | "sell" | "hold", instId, usdt, reason }
  return { action: "hold", instId: INST, usdt: 0, reason: "stub: plug the LLM in here", obs };
}

// --- Risk gate: code, not prompt. Returns { verdict: "allow"|"shrink"|"reject", order?, why } ---
const recent = [];
function gate(d) {
  if (d.action === "hold") return { verdict: "reject", why: "hold" };
  if (!policy.allowedInst.includes(d.instId)) return { verdict: "reject", why: `instrument ${d.instId} not allowed` };
  const hourAgo = Date.now() - 3_600_000;
  if (recent.filter((t) => t > hourAgo).length >= policy.maxOrdersPerHour) return { verdict: "reject", why: "rate limit" };
  const usdt = Math.min(d.usdt, policy.maxOrderUsdt);
  return { verdict: usdt < d.usdt ? "shrink" : "allow", usdt, why: usdt < d.usdt ? `capped to ${usdt}` : "ok" };
}

async function tick() {
  const ticker = await call("market_get_ticker", { instId: INST });
  const decision = await decide({ ticker });
  const g = gate(decision);
  let order = null;
  if (g.verdict !== "reject" && !DRY_RUN) {
    // spot market BUY: sz is quote amount (USDT). Market SELL: sz is base amount.
    order = await call("spot_place_order", {
      instId: decision.instId, tdMode: "cash", side: decision.action, ordType: "market", sz: String(g.usdt),
    });
    recent.push(Date.now());
  }
  const entry = { ts: new Date().toISOString(), profile: PROFILE, decision, gate: g, order };
  appendFileSync("decisions.jsonl", JSON.stringify(entry) + "\n");   // later: keccak256(entry) → AgentDecisionLog on Fuji
  console.log(entry.ts, g.verdict, g.why);
}

for (;;) {
  try { await tick(); } catch (e) { console.error("tick failed:", e.message, e.okx?.suggestion ?? ""); }
  await new Promise((r) => setTimeout(r, INTERVAL_MS));
}
