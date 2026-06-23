import type { ClientUpdate } from "../../domain/client/new-client.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export interface UpdateClientInput {
  readonly clientId: ClientId;
  readonly changes: ClientUpdate;
}

export interface UpdateClientResult {
  readonly updated: boolean;
  readonly reason?: string;
}

export class UpdateClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(input: UpdateClientInput): Promise<UpdateClientResult> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return { updated: false, reason: "Client not found" };
    }
    await this.clients.update(client.uuid, input.changes);
    return { updated: true };
  }
}
