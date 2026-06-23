import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { ClientScopeName } from "../../domain/shared/client-scope-name.js";

export interface AssignClientScopeInput {
  readonly clientId: ClientId;
  readonly scope: ClientScopeName;
}

export interface AssignClientScopeResult {
  readonly assigned: boolean;
  readonly reason?: string;
}

export class AssignClientScopeUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly scopes: ClientScopeRepository,
  ) {}

  async execute(
    input: AssignClientScopeInput,
  ): Promise<AssignClientScopeResult> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return { assigned: false, reason: "Client not found" };
    }
    const scope = await this.scopes.findScopeByName(input.scope);
    if (scope === null) {
      return { assigned: false, reason: "Scope not found" };
    }
    await this.scopes.assignDefaultScope(client.uuid, scope.id);
    return { assigned: true };
  }
}
