import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { RoleName } from "../../domain/shared/role-name.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface UnassignClientRoleInput {
  readonly userId: UserId;
  readonly clientId: ClientId;
  readonly role: RoleName;
}

export interface UnassignClientRoleResult {
  readonly removed: boolean;
  readonly reason?: string;
}

export class UnassignClientRoleUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly roles: RoleRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(
    input: UnassignClientRoleInput,
  ): Promise<UnassignClientRoleResult> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return { removed: false, reason: "Client not found" };
    }
    const role = await this.roles.findClientRole(client.uuid, input.role);
    if (role === null) {
      return { removed: false, reason: "Role not found" };
    }

    const operation = DestructiveOperation.of(
      `Remove client role ${input.role.toString()} (client ${input.clientId.toString()}) from user ${input.userId.toString()}`,
      "The user immediately loses the permissions granted by this client role.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { removed: false, reason: "Operation not confirmed" };
    }

    await this.roles.removeClientRole(input.userId, client.uuid, role);
    return { removed: true };
  }
}
