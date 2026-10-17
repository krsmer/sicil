// OKX Agent Trade Kit'e MCP (stdio) üzerinden bağlanır. ATK hataları exception değil, "error": true içeren JSON
// metin olarak döner; call() ikisini de exception'a çevirir.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function connectOkx({ profile, modules, readOnly = false, name = "sicil" }) {
  const args = ["--profile", profile, "--modules", modules, ...(readOnly ? ["--read-only"] : [])];
  const client = new Client({ name, version: "0.1.0" });
  await client.connect(new StdioClientTransport({ command: "okx-trade-mcp", args, stderr: "ignore" }));

  async function call(tool, args = {}) {
    const res = await client.callTool({ name: tool, arguments: args });
    const text = res.content?.find((c) => c.type === "text")?.text ?? "";
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    if (res.isError || data?.error || data?.ok === false) {
      throw Object.assign(new Error(`${tool}: ${data?.message ?? text}`), { okx: data });
    }
    // ATK yanıtı: { tool, ok, data: { endpoint, data: [...] } }
    return data?.data?.data ?? data?.data ?? data;
  }

  return { client, call, close: () => client.close() };
}
