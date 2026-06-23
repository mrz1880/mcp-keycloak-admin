import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import {
  buildRoleTools,
  type RoleToolDeps,
} from "../../../src/infrastructure/mcp/role-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aRole } from "../../support/roles.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

function deps(overrides: Partial<RoleToolDeps> = {}): RoleToolDeps {
  return {
    roleRepository: new InMemoryRoleRepository(),
    clientRepository: new InMemoryClientRepository(),
    confirmers,
    ...overrides,
  };
}

describe("role tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    expect(
      filterTools(buildRoleTools(deps()), ToolAccessPolicy.of(true)).map(
        (tool) => tool.name,
      ),
    ).toEqual([
      "keycloak_role_list",
      "keycloak_user_roles_get",
      "keycloak_client_roles_list",
      "keycloak_user_client_roles_get",
    ]);
  });

  it("assign handler assigns an existing realm role", async () => {
    const roleRepository = new InMemoryRoleRepository([aRole("admin")]);
    const assign = buildRoleTools(deps({ roleRepository })).find(
      (tool) => tool.name === "keycloak_user_role_assign",
    );

    const result = await assign!.handler({
      userId: "93d199e4-17b7-4035-95a5-237a748eec03",
      role: "admin",
    });

    expect(result.content[0]?.text).toContain("assigned");
    expect(roleRepository.assigned).toHaveLength(1);
  });

  it("client-role assign handler resolves the client and assigns", async () => {
    const roleRepository = new InMemoryRoleRepository(
      [],
      [],
      [aRole("uma_protection")],
    );
    const clientRepository = new InMemoryClientRepository([
      aClient("my-api", UUID),
    ]);
    const assign = buildRoleTools(
      deps({ roleRepository, clientRepository }),
    ).find((tool) => tool.name === "keycloak_user_client_role_assign");

    const result = await assign!.handler({
      userId: "93d199e4-17b7-4035-95a5-237a748eec03",
      clientId: "my-api",
      role: "uma_protection",
    });

    expect(result.content[0]?.text).toContain("assigned");
    expect(roleRepository.clientAssigned[0]?.clientUuid).toBe(UUID);
  });
});
