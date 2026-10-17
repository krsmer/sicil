# 05 — Hackathon context (for scoping decisions)

Full notes (Turkish): `ai-docs/hackathon/HACKATHON_BILGI.md` (rules, schedule, ATK details) and `ai-docs/hackathon/ODULLU_PROJELER.md` (past OKX hackathon winners, idea candidates).

- Event: Agentic Hackathon, OKX TR × Team1 Türkiye, Avalanche ecosystem partner. 17 Oct 2026, Ankara. 50 participants.
- Build: 10:00–19:00 (~9 h). Submission 19:00. Top 10 present 10 min each at 20:00. Prizes $1,500 / $1,000 / $500.
- Task: autonomous AI agent using OKX Agent Trade Kit. Bonus: real-market trading test with ATK; deploy on Avalanche.
- Judging: architecture & autonomy 35%, product & strategy 25%, technical quality 20%, demo & presentation 20%, bonuses extra.
- Jury is mostly OKX TR and Team1 Türkiye: Turkish-language UX and `site = "tr"` are a plus.
- Unknowns (ask at opening): team size, submission format (repo / video), whether pre-written code is allowed, whether "real market" means live keys or demo.

## What wins (from past OKX ATK hackathons, see ODULLU_PROJELER.md)
OKX praised: genetic/evolving strategies, signature-gated sandbox, multi-agent "war room", liquidation-rescue engine. Common thread: creative use of many ATK modules (funding, OI, indicators, algo orders, bots, smartmoney), visible safety controls, and a live demo of the agent acting alone. A bot that only calls `spot_place_order` is average.

## Decided project: SİCİL (see `memory-bank/`)
The idea below was an early candidate. The final project is **SİCİL**; its brief, architecture and plan live in `memory-bank/`. "Yeminli Agent" is close to the B plan (ANAYASA).

### Early candidate (superseded): "Yeminli Agent"
User writes rules in Turkish → agent converts to `policy.json` → user approves → policy hash on Avalanche Fuji → autonomous loop (market + news + smartmoney → LLM → risk gate → demo order) → every decision logged on Fuji. Demo moment: provoke the agent with bad news, show the gate rejecting an order that breaks the rules, show the event on Snowtrace.

## Scope rules for the 9 hours
1. First hour: ATK demo profile works end to end (ticker, balance, one demo order) and the Fuji contract is deployed. Everything else builds on that.
2. One loop, one dashboard, one on-chain contract. Polish the demo path, not breadth.
3. Keep a recorded backup demo and a `DRY_RUN` mode.
