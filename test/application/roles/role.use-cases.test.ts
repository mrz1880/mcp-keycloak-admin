import { describe, expect, it } from "vitest";

import { AssignUserRoleUseCase } from "../../../src/application/roles/assign-user-role.use-case.js";
import { GetUserRolesUseCase } from "../../../src/application/roles/get-user-roles.use-case.js";
import { ListRealmRolesUseCase } from "../../../src/application/roles/list-realm-roles.use-case.js";
import { UnassignUserRoleUseCase } from "../../../src/application/roles/unassign-user-role.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { RoleName } from "../../../src/domain/shared/role-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aRole } from "../../support/roles.js";

const ID = UserId.fromString("93d199e4-17b7-4035-95a5-237a748eec03");
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("role use cases", () => {
  it("lists realm roles", async () => {
    const repo = new InMemoryRoleRepository([aRole("admin"), aRole("user")]);
    const roles = await new ListRealmRolesUseCase(repo).execute();
    expect(roles.map((role) => role.name.toString())).toEqual([
      "admin",
      "user",
    ]);
  });

  it("gets a user's roles", async () => {
    const repo = new InMemoryRoleRepository([], [aRole("admin")]);
    const roles = await new GetUserRolesUseCase(repo).execute(ID);
    expect(roles[0]?.name.toString()).toBe("admin");
  });

  it("assigns an existing role", async () => {
    const repo = new InMemoryRoleRepository([aRole("admin")]);
    const result = await new AssignUserRoleUseCase(repo).execute({
      userId: ID,
      role: RoleName.fromString("admin"),
    });
    expect(result.assigned).toBe(true);
    expect(repo.assigned[0]).toEqual({ userId: ID.toString(), role: "admin" });
  });

  it("refuses to assign an unknown role", async () => {
    const result = await new AssignUserRoleUseCase(
      new InMemoryRoleRepository([]),
    ).execute({ userId: ID, role: RoleName.fromString("ghost") });
    expect(result.assigned).toBe(false);
  });

  it("removes a role once confirmed", async () => {
    const repo = new InMemoryRoleRepository([aRole("admin")]);
    const result = await new UnassignUserRoleUseCase(repo, approve).execute({
      userId: ID,
      role: RoleName.fromString("admin"),
    });
    expect(result.removed).toBe(true);
    expect(repo.removed[0]?.role).toBe("admin");
  });

  it("does not remove a role when declined", async () => {
    const repo = new InMemoryRoleRepository([aRole("admin")]);
    const result = await new UnassignUserRoleUseCase(repo, decline).execute({
      userId: ID,
      role: RoleName.fromString("admin"),
    });
    expect(result.removed).toBe(false);
    expect(repo.removed).toHaveLength(0);
  });
});
