import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { RoleName } from "../../domain/shared/role-name.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface UnassignUserRoleInput {
  readonly userId: UserId;
  readonly role: RoleName;
}

export interface UnassignUserRoleResult {
  readonly removed: boolean;
  readonly reason?: string;
}

export class UnassignUserRoleUseCase {
  constructor(
    private readonly roles: RoleRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(input: UnassignUserRoleInput): Promise<UnassignUserRoleResult> {
    const role = await this.roles.findRealmRole(input.role);
    if (role === null) {
      return { removed: false, reason: "Role not found" };
    }

    const operation = DestructiveOperation.of(
      `Remove role ${role.name.toString()} from user ${input.userId.toString()}`,
      "The user immediately loses every permission granted by this role.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { removed: false, reason: "Operation not confirmed" };
    }

    await this.roles.removeRealmRole(input.userId, role);
    return { removed: true };
  }
}
