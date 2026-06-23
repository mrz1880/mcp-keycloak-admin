import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { ToolLevel } from "../../../src/domain/policy/tool-level.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { buildUserTools } from "../../../src/infrastructure/mcp/user-tools.js";
import { InMemoryUserRepository } from "../../support/in-memory-user-repository.js";
import { aUser } from "../../support/users.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };
const approving: ConfirmerFactory = { create: () => approve };
const declining: ConfirmerFactory = { create: () => decline };

function tools(
  repository: InMemoryUserRepository,
  confirmers: ConfirmerFactory = approving,
) {
  return buildUserTools({ userRepository: repository, confirmers });
}

function named(repository: InMemoryUserRepository, name: string) {
  const tool = tools(repository).find((candidate) => candidate.name === name);
  if (tool === undefined) {
    throw new Error(`tool ${name} not found`);
  }
  return tool;
}

describe("user tools", () => {
  it("exposes search as read-only and delete as destructive", () => {
    const repo = new InMemoryUserRepository();
    const all = tools(repo);
    const search = all.find((t) => t.name === "keycloak_user_search");
    const remove = all.find((t) => t.name === "keycloak_user_delete");

    expect(search?.annotations.readOnlyHint).toBe(true);
    expect(remove?.level).toBe(ToolLevel.Destructive);
    expect(remove?.annotations.destructiveHint).toBe(true);
  });

  it("keeps only read tools under the read-only policy", () => {
    const allowed = filterTools(
      tools(new InMemoryUserRepository()),
      ToolAccessPolicy.of(true),
    );
    expect(allowed.map((t) => t.name)).toEqual([
      "keycloak_user_search",
      "keycloak_user_get",
      "keycloak_user_sessions_list",
    ]);
  });

  it("create handler creates a user", async () => {
    const repo = new InMemoryUserRepository();
    const result = await named(repo, "keycloak_user_create").handler({
      username: "newbie",
      email: "n@e.com",
    });
    expect(result.content[0]?.text).toContain("created");
    expect(repo.createdUsers).toHaveLength(1);
  });

  it("search handler returns the matching users", async () => {
    const repo = new InMemoryUserRepository([aUser()]);
    const result = await named(repo, "keycloak_user_search").handler({
      username: "jdupont",
    });
    expect(result.content[0]?.text).toContain("jdupont");
  });

  it("delete handler deletes when confirmed", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const remove = tools(repo, approving).find(
      (t) => t.name === "keycloak_user_delete",
    );

    const result = await remove!.handler({
      id: user.id.toString(),
      username: "jdupont",
      confirm: true,
    });

    expect(result.content[0]?.text).toContain("deleted");
    expect(repo.deletedIds).toHaveLength(1);
  });

  it("delete handler does not delete when confirmation is refused", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const remove = tools(repo, declining).find(
      (t) => t.name === "keycloak_user_delete",
    );

    const result = await remove!.handler({
      id: user.id.toString(),
      username: "jdupont",
    });

    expect(result.content[0]?.text).toContain("Not deleted");
    expect(repo.deletedIds).toHaveLength(0);
  });
});
