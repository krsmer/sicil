#!/usr/bin/env bash
# Refresh ai-docs/sources/ from the official repos. Run from the repo root: bash ai-docs/scripts/sync-sources.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT

git clone --depth 1 https://github.com/okx/agent-trade-kit.git "$TMP/atk"
OUT="$ROOT/sources/okx-atk"; mkdir -p "$OUT"
cp "$TMP/atk/README.md" "$TMP/atk/ARCHITECTURE.md" "$OUT/"
rm -rf "$OUT/docs" "$OUT/skills"; cp -r "$TMP/atk/docs" "$OUT/docs"; cp -r "$TMP/atk/skills" "$OUT/skills"
(cd "$TMP/atk" && git log -1 --format='%H %cd') > "$OUT/SOURCE_VERSION.txt"

git clone --depth 1 --filter=blob:none --sparse https://github.com/ava-labs/builders-hub.git "$TMP/bh"
(cd "$TMP/bh" && git sparse-checkout set content/docs/primary-network/verify-contract content/docs/tooling/contract-verification \
  content/docs/tooling/ai-llm content/docs/api-reference/data-api content/common content/integrations content/academy/blockchain/x402-payment-infrastructure)
A="$ROOT/sources/avalanche"; mkdir -p "$A/x402-course"
cd "$TMP/bh/content"
for f in common/avalanche-starter-kit/foundry-quickstart.mdx common/core-wallet/faucet.mdx \
  docs/primary-network/verify-contract/snowtrace.mdx docs/primary-network/verify-contract/hardhat.mdx \
  docs/tooling/contract-verification/index.mdx docs/tooling/ai-llm/mcp-server.mdx docs/tooling/ai-llm/llms-txt.mdx \
  docs/api-reference/data-api/getting-started.mdx docs/api-reference/data-api/data-vs-rpc.mdx docs/api-reference/data-api/rate-limits.mdx \
  integrations/0xgasless.mdx integrations/chainlink-data-feeds.mdx integrations/pyth.mdx integrations/thirdweb-x402.mdx; do
  [ -f "$f" ] && grep -v '^import ' "$f" > "$A/$(echo "$f" | tr '/' '_' | sed 's/\.mdx$/.md/')"
done
find academy/blockchain/x402-payment-infrastructure -name '*.mdx' | while read -r f; do
  grep -v '^import ' "$f" > "$A/x402-course/$(echo "${f#academy/blockchain/x402-payment-infrastructure/}" | tr '/' '_' | sed 's/\.mdx$/.md/')"
done
(cd "$TMP/bh" && git log -1 --format='%H %cd') > "$A/SOURCE_VERSION.txt"

# Regenerate the MCP tool catalog if okx-trade-mcp is installed:
#   node ai-docs/scripts/dump-tool-catalog.mjs ai-docs/sources/okx-atk/TOOL_CATALOG.md
echo "Sources refreshed."
