import type { RoleRepository } from "../../src/domain/ports/role-repository.js";
import type { Role } from "../../src/domain/role/role.js";
import type { ClientUuid } from "../../src/domain/shared/client-uuid.js";
import type { RoleName } from "../../src/domain/shared/role-name.js";
import type { UserId } from "../../src/domain/shared/user-id.js";

export class InMemoryRoleRepository implements RoleRepository {
  readonly assigned: { userId: string; role: string }[] = [];
  readonly removed: { userId: string; role: string }[] = [];
  readonly clientAssigned: {
    userId: string;
    clientUuid: string;
    role: string;
  }[] = [];
  readonly clientRemoved: {
    userId: string;
    clientUuid: string;
    role: string;
  }[] = [];
  private readonly realmRoles: Role[];
  private readonly userRoles: Role[];
  private readonly clientRoles: Role[];
  private readonly userClientRoles: Role[];

  constructor(
    realmRoles: Role[] = [],
    userRoles: Role[] = [],
    clientRoles: Role[] = [],
    userClientRoles: Role[] = [],
  ) {
    this.realmRoles = realmRoles;
    this.userRoles = userRoles;
    this.clientRoles = clientRoles;
    this.userClientRoles = userClientRoles;
  }

  listRealmRoles(): Promise<Role[]> {
    return Promise.resolve(this.realmRoles);
  }

  findRealmRole(name: RoleName): Promise<Role | null> {
    return Promise.resolve(
      this.realmRoles.find((role) => role.name.equals(name)) ?? null,
    );
  }

  listUserRealmRoles(): Promise<Role[]> {
    return Promise.resolve(this.userRoles);
  }

  assignRealmRole(userId: UserId, role: Role): Promise<void> {
    this.assigned.push({
      userId: userId.toString(),
      role: role.name.toString(),
    });
    return Promise.resolve();
  }

  removeRealmRole(userId: UserId, role: Role): Promise<void> {
    this.removed.push({
      userId: userId.toString(),
      role: role.name.toString(),
    });
    return Promise.resolve();
  }

  listClientRoles(): Promise<Role[]> {
    return Promise.resolve(this.clientRoles);
  }

  findClientRole(
    _clientUuid: ClientUuid,
    name: RoleName,
  ): Promise<Role | null> {
    return Promise.resolve(
      this.clientRoles.find((role) => role.name.equals(name)) ?? null,
    );
  }

  listUserClientRoles(): Promise<Role[]> {
    return Promise.resolve(this.userClientRoles);
  }

  assignClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void> {
    this.clientAssigned.push({
      userId: userId.toString(),
      clientUuid: clientUuid.toString(),
      role: role.name.toString(),
    });
    return Promise.resolve();
  }

  removeClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void> {
    this.clientRemoved.push({
      userId: userId.toString(),
      clientUuid: clientUuid.toString(),
      role: role.name.toString(),
    });
    return Promise.resolve();
  }
}
