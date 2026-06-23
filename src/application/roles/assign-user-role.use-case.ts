import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { RoleName } from "../../domain/shared/role-name.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface AssignUserRoleInput {
  readonly userId: UserId;
  readonly role: RoleName;
}

export interface AssignUserRoleResult {
  readonly assigned: boolean;
  readonly reason?: string;
}

export class AssignUserRoleUseCase {
  constructor(private readonly roles: RoleRepository) {}

  async execute(input: AssignUserRoleInput): Promise<AssignUserRoleResult> {
    const role = await this.roles.findRealmRole(input.role);
    if (role === null) {
      return { assigned: false, reason: "Role not found" };
    }
    await this.roles.assignRealmRole(input.userId, role);
    return { assigned: true };
  }
}
