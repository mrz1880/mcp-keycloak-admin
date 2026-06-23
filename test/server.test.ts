import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { describe, expect, it } from "vitest";

import type { AppConfig } from "../src/config/config.js";
import { createServer } from "../src/server.js";

const baseConfig: AppConfig = {
  baseUrl: "http://localhost:8080",
  realm: "demo-realm",
  readOnly: false,
  allowedRealms: [],
  auth: { mode: "service_account", clientId: "mcp-admin", clientSecret: "s" },
};

describe("createServer", () => {
  it("builds an MCP server for a valid configuration", () => {
    expect(createServer(baseConfig)).toBeInstanceOf(McpServer);
  });

  it("rejects a target realm outside the allow-list", () => {
    expect(() =>
      createServer({ ...baseConfig, allowedRealms: ["other"] }),
    ).toThrow(/demo-realm/);
  });
});
