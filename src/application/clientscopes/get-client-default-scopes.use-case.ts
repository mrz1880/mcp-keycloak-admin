import type { ClientScope } from "../../domain/clientscope/client-scope.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";

export class GetClientDefaultScopesUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly scopes: ClientScopeRepository,
  ) {}

  async execute(clientId: ClientId): Promise<ClientScope[] | null> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return null;
    }
    return this.scopes.defaultScopes(client.uuid);
  }
}
