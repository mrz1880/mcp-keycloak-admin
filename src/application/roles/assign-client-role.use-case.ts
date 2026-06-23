import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { RoleName } from "../../domain/shared/role-name.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface AssignClientRoleInput {
  readonly userId: UserId;
  readonly clientId: ClientId;
  readonly role: RoleName;
}

export interface AssignClientRoleResult {
  readonly assigned: boolean;
  readonly reason?: string;
}

export class AssignClientRoleUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly roles: RoleRepository,
  ) {}

  async execute(input: AssignClientRoleInput): Promise<AssignClientRoleResult> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return { assigned: false, reason: "Client not found" };
    }
    const role = await this.roles.findClientRole(client.uuid, input.role);
    if (role === null) {
      return { assigned: false, reason: "Role not found" };
    }
    await this.roles.assignClientRole(input.userId, client.uuid, role);
    return { assigned: true };
  }
}
