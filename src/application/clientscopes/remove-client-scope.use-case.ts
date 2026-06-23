import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { ClientScopeName } from "../../domain/shared/client-scope-name.js";

export interface RemoveClientScopeInput {
  readonly clientId: ClientId;
  readonly scope: ClientScopeName;
}

export interface RemoveClientScopeResult {
  readonly removed: boolean;
  readonly reason?: string;
}

export class RemoveClientScopeUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly scopes: ClientScopeRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(
    input: RemoveClientScopeInput,
  ): Promise<RemoveClientScopeResult> {
    const client = await this.clients.findByClientId(input.clientId);
    if (client === null) {
      return { removed: false, reason: "Client not found" };
    }
    const scope = await this.scopes.findScopeByName(input.scope);
    if (scope === null) {
      return { removed: false, reason: "Scope not found" };
    }

    const operation = DestructiveOperation.of(
      `Remove default scope ${input.scope.toString()} from client ${input.clientId.toString()}`,
      "The client stops emitting the claims and roles this scope contributes " +
        "to its tokens.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { removed: false, reason: "Operation not confirmed" };
    }

    await this.scopes.removeDefaultScope(client.uuid, scope.id);
    return { removed: true };
  }
}
