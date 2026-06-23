import { describe, expect, it } from "vitest";

import type { EventLog } from "../../../src/domain/ports/event-log.js";
import type { RealmInfo } from "../../../src/domain/ports/realm-info.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildEventRealmTools } from "../../../src/infrastructure/mcp/event-realm-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";

const eventLog: EventLog = {
  loginEvents: () => Promise.resolve([]),
  adminEvents: () => Promise.resolve([]),
};

const realmInfo: RealmInfo = {
  getRealmConfig: () =>
    Promise.resolve({ realm: "demo-realm", enabled: true, secret: "x" }),
  serverInfo: () => Promise.resolve({ systemInfo: { version: "26.0.5" } }),
};

describe("event & realm tools", () => {
  it("are all read-only and survive the read-only policy", () => {
    const tools = buildEventRealmTools({ eventLog, realmInfo });
    expect(filterTools(tools, ToolAccessPolicy.of(true))).toHaveLength(4);
  });

  it("realm config tool returns only curated fields", async () => {
    const tools = buildEventRealmTools({ eventLog, realmInfo });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_realm_get_config",
    );
    const result = await tool!.handler({});
    expect(result.content[0]?.text).toContain("demo-realm");
    expect(result.content[0]?.text).not.toContain("secret");
  });

  it("server info tool returns the Keycloak version", async () => {
    const tools = buildEventRealmTools({ eventLog, realmInfo });
    const tool = tools.find(
      (candidate) => candidate.name === "keycloak_server_info",
    );
    const result = await tool!.handler({});
    expect(result.content[0]?.text).toContain("26.0.5");
  });
});
