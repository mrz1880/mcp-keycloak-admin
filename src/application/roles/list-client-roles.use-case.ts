import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { Role } from "../../domain/role/role.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export class ListClientRolesUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(clientId: ClientId): Promise<Role[] | null> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return null;
    }
    return this.roles.listClientRoles(client.uuid);
  }
}
