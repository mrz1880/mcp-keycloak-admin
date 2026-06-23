import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { GroupId } from "../../domain/shared/group-id.js";
import type { RoleName } from "../../domain/shared/role-name.js";

export interface AssignGroupRoleInput {
  readonly groupId: GroupId;
  readonly role: RoleName;
}

export interface AssignGroupRoleResult {
  readonly assigned: boolean;
  readonly reason?: string;
}

export class AssignGroupRoleUseCase {
  constructor(
    private readonly roles: RoleRepository,
    private readonly groups: GroupRepository,
  ) {}

  async execute(input: AssignGroupRoleInput): Promise<AssignGroupRoleResult> {
    const role = await this.roles.findRealmRole(input.role);
    if (role === null) {
      return { assigned: false, reason: "Role not found" };
    }
    await this.groups.assignRealmRole(input.groupId, role);
    return { assigned: true };
  }
}
