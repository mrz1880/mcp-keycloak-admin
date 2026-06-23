import type { RoleRepository } from "../../src/domain/ports/role-repository.js";
import type { Role } from "../../src/domain/role/role.js";
import type { RoleName } from "../../src/domain/shared/role-name.js";
import type { UserId } from "../../src/domain/shared/user-id.js";

export class InMemoryRoleRepository implements RoleRepository {
  readonly assigned: { userId: string; role: string }[] = [];
  readonly removed: { userId: string; role: string }[] = [];
  private readonly realmRoles: Role[];
  private readonly userRoles: Role[];

  constructor(realmRoles: Role[] = [], userRoles: Role[] = []) {
    this.realmRoles = realmRoles;
    this.userRoles = userRoles;
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
}
