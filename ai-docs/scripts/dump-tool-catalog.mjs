// Dump every okx-trade-mcp tool (name, description, params) to markdown. Needs: npm i @modelcontextprotocol/sdk, okx-trade-mcp on PATH.
// Usage: node dump-tool-catalog.mjs TOOL_CATALOG.md
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";
const transport = new StdioClientTransport({ command: "okx-trade-mcp", args: ["--modules", "all"] });
const client = new Client({ name: "dump", version: "0.0.1" });
await client.connect(transport);
const { tools } = await client.listTools();
let md = `# OKX ATK — MCP tool catalog (generated)\n\nGenerated ${new Date().toISOString()} from \`okx-trade-mcp@1.4.8 --modules all\` via MCP listTools (no API key configured).\nTool count: ${tools.length}. Each entry: name, description, required params, all params. \`[CAUTION]\`-type tools move funds.\n\n`;
const byMod = {};
for (const t of tools) { const m = t.name.split("_")[0]; (byMod[m] ||= []).push(t); }
for (const [m, ts] of Object.entries(byMod)) {
  md += `## ${m} (${ts.length})\n\n`;
  for (const t of ts) {
    const p = t.inputSchema?.properties || {}; const req = t.inputSchema?.required || [];
    md += `### \`${t.name}\`${t.annotations?.readOnlyHint ? " · read-only" : " · WRITE"}\n${(t.description||"").trim()}\n\n`;
    const keys = Object.keys(p);
    if (keys.length) { md += `| param | type | req | description |\n|---|---|---|---|\n`; for (const k of keys) { const s = p[k]; const ty = s.enum ? s.enum.join("\\|") : (s.type || (s.anyOf? "any":"")); md += `| ${k} | ${Array.isArray(ty)?ty.join("/"):ty} | ${req.includes(k)?"✓":""} | ${(s.description||"").replace(/\n/g," ").replace(/\|/g,"\\|")} |\n`; } md += "\n"; }
  }
}
fs.writeFileSync(process.argv[2], md);
console.log(tools.length, Object.entries(byMod).map(([m,t])=>m+":"+t.length).join(" "));
await client.close();
