import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { Role } from "../../domain/role/role.js";
import type { UserId } from "../../domain/shared/user-id.js";

export class GetUserRolesUseCase {
  constructor(private readonly roles: RoleRepository) {}

  execute(userId: UserId): Promise<Role[]> {
    return this.roles.listUserRealmRoles(userId);
  }
}
