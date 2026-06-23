import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { ClientSecret } from "../../domain/shared/client-secret.js";

export class GetClientSecretUseCase {
  constructor(private readonly clients: ClientRepository) {}

  async execute(clientId: ClientId): Promise<ClientSecret | null> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return null;
    }
    return this.clients.getSecret(client.uuid);
  }
}
