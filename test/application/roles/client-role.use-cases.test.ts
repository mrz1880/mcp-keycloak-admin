import { describe, expect, it } from "vitest";

import { AssignClientRoleUseCase } from "../../../src/application/roles/assign-client-role.use-case.js";
import { GetUserClientRolesUseCase } from "../../../src/application/roles/get-user-client-roles.use-case.js";
import { ListClientRolesUseCase } from "../../../src/application/roles/list-client-roles.use-case.js";
import { UnassignClientRoleUseCase } from "../../../src/application/roles/unassign-client-role.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ClientId } from "../../../src/domain/shared/client-id.js";
import { RoleName } from "../../../src/domain/shared/role-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aRole } from "../../support/roles.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const USER = UserId.fromString("93d199e4-17b7-4035-95a5-237a748eec03");
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

const apiClient = () => new InMemoryClientRepository([aClient("api", UUID)]);

describe("client role use cases", () => {
  it("lists a known client's roles", async () => {
    const roles = new InMemoryRoleRepository([], [], [aRole("r")]);
    const result = await new ListClientRolesUseCase(apiClient(), roles).execute(
      ClientId.fromString("api"),
    );
    expect(result?.[0]?.name.toString()).toBe("r");
  });

  it("returns null for an unknown client", async () => {
    const result = await new ListClientRolesUseCase(
      new InMemoryClientRepository([]),
      new InMemoryRoleRepository(),
    ).execute(ClientId.fromString("ghost"));
    expect(result).toBeNull();
  });

  it("gets a user's client roles", async () => {
    const roles = new InMemoryRoleRepository([], [], [], [aRole("r")]);
    const result = await new GetUserClientRolesUseCase(
      apiClient(),
      roles,
    ).execute({ userId: USER, clientId: ClientId.fromString("api") });
    expect(result?.[0]?.name.toString()).toBe("r");
  });

  it("assigns a client role by resolving client and role", async () => {
    const roles = new InMemoryRoleRepository([], [], [aRole("r")]);
    const result = await new AssignClientRoleUseCase(
      apiClient(),
      roles,
    ).execute({
      userId: USER,
      clientId: ClientId.fromString("api"),
      role: RoleName.fromString("r"),
    });
    expect(result.assigned).toBe(true);
    expect(roles.clientAssigned[0]?.clientUuid).toBe(UUID);
  });

  it("refuses to assign an unknown client role", async () => {
    const result = await new AssignClientRoleUseCase(
      apiClient(),
      new InMemoryRoleRepository(),
    ).execute({
      userId: USER,
      clientId: ClientId.fromString("api"),
      role: RoleName.fromString("ghost"),
    });
    expect(result.assigned).toBe(false);
  });

  it("removes a client role once confirmed", async () => {
    const roles = new InMemoryRoleRepository([], [], [aRole("r")]);
    const result = await new UnassignClientRoleUseCase(
      apiClient(),
      roles,
      approve,
    ).execute({
      userId: USER,
      clientId: ClientId.fromString("api"),
      role: RoleName.fromString("r"),
    });
    expect(result.removed).toBe(true);
    expect(roles.clientRemoved).toHaveLength(1);
  });

  it("does not remove a client role when declined", async () => {
    const roles = new InMemoryRoleRepository([], [], [aRole("r")]);
    const result = await new UnassignClientRoleUseCase(
      apiClient(),
      roles,
      decline,
    ).execute({
      userId: USER,
      clientId: ClientId.fromString("api"),
      role: RoleName.fromString("r"),
    });
    expect(result.removed).toBe(false);
    expect(roles.clientRemoved).toHaveLength(0);
  });
});
