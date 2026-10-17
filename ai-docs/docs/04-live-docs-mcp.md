# 04 — Live documentation access while coding

The files in `ai-docs/` are a snapshot. While coding, the AI can also query live sources. Install these before 17 Oct and test each once.

## 1. Avalanche docs MCP (official, hosted, read-only, no key)
Endpoint `https://build.avax.network/api/mcp` (HTTP transport). Tools: `docs_search`, `docs_fetch`, `docs_list_sections`, `cli_lookup_command`, `rpc_lookup_method`, `acp_lookup`, `acp_list`, `github_search_code`, `github_get_file`, `github_list_repositories`, `blockchain_get_native_balance`, `blockchain_get_contract_info`, `blockchain_lookup_*`, `platform_get_*`, `info_*`.

- Claude Code: `claude mcp add avalanche-docs --transport http https://build.avax.network/api/mcp` (or the repo `.mcp.json`, template `ai-docs/templates/.mcp.json`)
- Cursor (`.cursor/mcp.json`): `{ "mcpServers": { "avalanche-docs": { "url": "https://build.avax.network/api/mcp" } } }`
- Claude Desktop (no native HTTP): `{ "mcpServers": { "avalanche-docs": { "command": "npx", "args": ["-y", "mcp-remote", "https://build.avax.network/api/mcp"] } } }`
- Useful for: "how do I verify on Fuji", "find the Teleporter contract", checking a deployed contract/balance on Fuji.

## 2. Avalanche llms.txt (no MCP needed)
- Index: https://build.avax.network/llms.txt
- Everything in one file (1,300+ pages, too big for most contexts): https://build.avax.network/llms-full.txt
- Any page as clean markdown: append `.md`, e.g. https://build.avax.network/docs/tooling/contract-verification.md

## 3. OKX ATK MCP (local, stdio): live market data + demo account for the coding AI
```bash
claude mcp add --transport stdio okx-demo -- okx-trade-mcp --profile demo --modules market,spot,swap,account,news,smartmoney
claude mcp add --transport stdio okx-market -- okx-trade-mcp --modules market      # no key needed
```
Lets the coding AI check real responses (field names, sizes, errors) instead of guessing JSON shapes. Keep it on the **demo** profile. In Cursor, stay under ~40 tools per server (no `--modules all`).

## 4. OKX ATK knowledge
- No official OKX docs MCP exists. Use the snapshot in `ai-docs/sources/okx-atk/` (docs, skills, generated TOOL_CATALOG.md) and `okx list-tools --json` for the installed version.
- DeepWiki (Q&A over the repo): https://deepwiki.com/okx/agent-trade-kit. DeepWiki also offers an MCP server (`https://mcp.deepwiki.com/mcp`) that answers questions about public GitHub repos.
- Official Skills can be installed so Claude Code can drive the `okx` CLI directly: copy `ai-docs/sources/okx-atk/skills/okx-cex-*` into `.claude/skills/`, or `npx skills add okx/agent-skills`.

## 5. Refresh the snapshot
`bash ai-docs/scripts/sync-sources.sh` (re-clones both repos), then `node ai-docs/scripts/dump-tool-catalog.mjs ai-docs/sources/okx-atk/TOOL_CATALOG.md` if the ATK version changed (`okx --version`; snapshot is 1.4.8).
