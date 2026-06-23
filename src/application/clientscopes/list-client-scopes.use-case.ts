import type { ClientScope } from "../../domain/clientscope/client-scope.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";

export class ListClientScopesUseCase {
  constructor(private readonly scopes: ClientScopeRepository) {}

  execute(): Promise<ClientScope[]> {
    return this.scopes.listScopes();
  }
}
