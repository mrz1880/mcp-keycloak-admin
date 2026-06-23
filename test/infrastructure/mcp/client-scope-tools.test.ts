import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildClientScopeTools } from "../../../src/infrastructure/mcp/client-scope-tools.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aClientScope } from "../../support/client-scopes.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";
import { InMemoryClientScopeRepository } from "../../support/in-memory-client-scope-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

describe("client scope tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildClientScopeTools({
      clientRepository: new InMemoryClientRepository(),
      clientScopeRepository: new InMemoryClientScopeRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_client_scopes_list",
      "keycloak_client_default_scopes_get",
      "keycloak_client_mappers_list",
    ]);
  });

  it("assign handler assigns a scope", async () => {
    const clientScopeRepository = new InMemoryClientScopeRepository([
      aClientScope("profile"),
    ]);
    const tools = buildClientScopeTools({
      clientRepository: new InMemoryClientRepository([
        aClient("mcp-admin", UUID),
      ]),
      clientScopeRepository,
      confirmers,
    });
    const assign = tools.find(
      (tool) => tool.name === "keycloak_client_scope_assign",
    );

    const result = await assign!.handler({
      clientId: "mcp-admin",
      scope: "profile",
    });

    expect(result.content[0]?.text).toContain("assigned");
    expect(clientScopeRepository.assigned).toHaveLength(1);
  });
});
