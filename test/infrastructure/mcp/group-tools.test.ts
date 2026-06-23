import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import {
  buildGroupTools,
  type GroupToolDeps,
} from "../../../src/infrastructure/mcp/group-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryGroupRepository } from "../../support/in-memory-group-repository.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aRole } from "../../support/roles.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

function deps(overrides: Partial<GroupToolDeps> = {}): GroupToolDeps {
  return {
    groupRepository: new InMemoryGroupRepository(),
    roleRepository: new InMemoryRoleRepository(),
    confirmers,
    ...overrides,
  };
}

describe("group tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildGroupTools(deps());
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_group_list",
      "keycloak_group_members_list",
      "keycloak_user_groups_list",
    ]);
  });

  it("create handler creates a group", async () => {
    const groupRepository = new InMemoryGroupRepository();
    const tools = buildGroupTools(deps({ groupRepository }));
    const create = tools.find((tool) => tool.name === "keycloak_group_create");

    const result = await create!.handler({ name: "staff" });

    expect(result.content[0]?.text).toContain("created");
    expect(groupRepository.created).toEqual(["staff"]);
  });

  it("role-assign handler grants an existing role to a group", async () => {
    const groupRepository = new InMemoryGroupRepository();
    const roleRepository = new InMemoryRoleRepository([aRole("admin")]);
    const tools = buildGroupTools(deps({ groupRepository, roleRepository }));
    const assign = tools.find(
      (tool) => tool.name === "keycloak_group_role_assign",
    );

    const result = await assign!.handler({
      groupId: "a1a1a1a1-17b7-4035-95a5-237a748eec03",
      role: "admin",
    });

    expect(result.content[0]?.text).toContain("assigned");
    expect(groupRepository.assignedRoles).toHaveLength(1);
  });
});
