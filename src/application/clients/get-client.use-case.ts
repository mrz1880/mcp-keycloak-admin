import type { ClientSummary } from "../../domain/client/client-summary.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export class GetClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  execute(clientId: ClientId): Promise<ClientSummary | null> {
    return this.clients.findByClientId(clientId);
  }
}
