import type { AuthzEntry } from "../../domain/authz/authorization.js";
import type { AuthorizationRepository } from "../../domain/ports/authorization-repository.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export class ListAuthzResourcesUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly authz: AuthorizationRepository,
  ) {}

  async execute(clientId: ClientId): Promise<AuthzEntry[] | null> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return null;
    }
    return this.authz.resources(client.uuid);
  }
}
