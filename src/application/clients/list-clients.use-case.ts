import type { ClientSummary } from "../../domain/client/client-summary.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";

export class ListClientsUseCase {
  constructor(private readonly clients: ClientRepository) {}

  execute(): Promise<ClientSummary[]> {
    return this.clients.list();
  }
}
