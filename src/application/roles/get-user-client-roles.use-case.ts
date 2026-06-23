import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { Role } from "../../domain/role/role.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface GetUserClientRolesInput {
  readonly userId: UserId;
  readonly clientId: ClientId;
}

export class GetUserClientRolesUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(input: GetUserClientRolesInput): Promise<Role[] | null> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return null;
    }
    return this.roles.listUserClientRoles(input.userId, client.uuid);
  }
}
