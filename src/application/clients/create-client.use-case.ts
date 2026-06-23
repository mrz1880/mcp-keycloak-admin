import type { NewClient } from "../../domain/client/new-client.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";

export class CreateClientUseCase {
  constructor(private readonly clients: ClientRepository) {}

  execute(client: NewClient): Promise<void> {
    return this.clients.create(client);
  }
}
