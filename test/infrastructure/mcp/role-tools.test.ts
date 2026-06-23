import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { buildRoleTools } from "../../../src/infrastructure/mcp/role-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aRole } from "../../support/roles.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

describe("role tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildRoleTools({
      roleRepository: new InMemoryRoleRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual(["keycloak_role_list", "keycloak_user_roles_get"]);
  });

  it("assign handler assigns an existing role", async () => {
    const repo = new InMemoryRoleRepository([aRole("admin")]);
    const tools = buildRoleTools({ roleRepository: repo, confirmers });
    const assign = tools.find(
      (tool) => tool.name === "keycloak_user_role_assign",
    );

    const result = await assign!.handler({
      userId: "93d199e4-17b7-4035-95a5-237a748eec03",
      role: "admin",
    });

    expect(result.content[0]?.text).toContain("assigned");
    expect(repo.assigned).toHaveLength(1);
  });
});
