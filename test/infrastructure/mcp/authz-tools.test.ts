import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildAuthzTools } from "../../../src/infrastructure/mcp/authz-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aClient } from "../../support/clients.js";
import { InMemoryAuthorizationRepository } from "../../support/in-memory-authorization-repository.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";

describe("authorization tools", () => {
  it("exposes three read-only tools", () => {
    const tools = buildAuthzTools({
      clientRepository: new InMemoryClientRepository(),
      authorizationRepository: new InMemoryAuthorizationRepository(),
    });
    expect(filterTools(tools, ToolAccessPolicy.of(true))).toHaveLength(3);
  });

  it("resources handler returns the resources of a known client", async () => {
    const tools = buildAuthzTools({
      clientRepository: new InMemoryClientRepository([
        aClient("mcp-admin", UUID),
      ]),
      authorizationRepository: new InMemoryAuthorizationRepository([
        { id: "r1", name: "res", type: "resource" },
      ]),
    });
    const resources = tools.find(
      (tool) => tool.name === "keycloak_authz_resources_list",
    );

    const result = await resources!.handler({ clientId: "mcp-admin" });

    expect(result.content[0]?.text).toContain("res");
  });

  it("reports a missing client", async () => {
    const tools = buildAuthzTools({
      clientRepository: new InMemoryClientRepository([]),
      authorizationRepository: new InMemoryAuthorizationRepository(),
    });
    const resources = tools.find(
      (tool) => tool.name === "keycloak_authz_resources_list",
    );

    const result = await resources!.handler({ clientId: "ghost" });

    expect(result.content[0]?.text).toContain("Client not found");
  });
});
