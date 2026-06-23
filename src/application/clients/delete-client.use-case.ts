import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export interface DeleteClientResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteClientUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(clientId: ClientId): Promise<DeleteClientResult> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return { deleted: false, reason: "Client not found" };
    }

    const operation = DestructiveOperation.of(
      `Delete client ${clientId.toString()}`,
      "Removes the client and everything attached to it (roles, scopes, " +
        "service account). Applications using it stop working. Irreversible.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }

    await this.clients.delete(client.uuid);
    return { deleted: true };
  }
}
