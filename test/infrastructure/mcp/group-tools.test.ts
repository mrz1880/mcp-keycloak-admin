import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { buildGroupTools } from "../../../src/infrastructure/mcp/group-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryGroupRepository } from "../../support/in-memory-group-repository.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

describe("group tools", () => {
  it("keeps only the read tool under the read-only policy", () => {
    const tools = buildGroupTools({
      groupRepository: new InMemoryGroupRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual(["keycloak_group_list"]);
  });

  it("create handler creates a group", async () => {
    const repo = new InMemoryGroupRepository();
    const tools = buildGroupTools({ groupRepository: repo, confirmers });
    const create = tools.find((tool) => tool.name === "keycloak_group_create");

    const result = await create!.handler({ name: "staff" });

    expect(result.content[0]?.text).toContain("created");
    expect(repo.created).toEqual(["staff"]);
  });
});
