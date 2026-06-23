import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { loadConfig } from "./config/config.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const server = createServer(config);
  await server.connect(new StdioServerTransport());
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
