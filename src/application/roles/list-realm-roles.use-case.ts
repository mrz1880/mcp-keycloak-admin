import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { Role } from "../../domain/role/role.js";

export class ListRealmRolesUseCase {
  constructor(private readonly roles: RoleRepository) {}

  execute(): Promise<Role[]> {
    return this.roles.listRealmRoles();
  }
}
