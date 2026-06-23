import type {
  ClientScope,
  ProtocolMapper,
} from "../../src/domain/clientscope/client-scope.js";
import type { ClientScopeRepository } from "../../src/domain/ports/client-scope-repository.js";
import type { ClientScopeId } from "../../src/domain/shared/client-scope-id.js";
import type { ClientScopeName } from "../../src/domain/shared/client-scope-name.js";
import type { ClientUuid } from "../../src/domain/shared/client-uuid.js";

export class InMemoryClientScopeRepository implements ClientScopeRepository {
  readonly assigned: { clientUuid: string; scopeId: string }[] = [];
  readonly removed: { clientUuid: string; scopeId: string }[] = [];
  private readonly scopes: ClientScope[];
  private readonly defaults: ClientScope[];
  private readonly mappers: ProtocolMapper[];

  constructor(
    scopes: ClientScope[] = [],
    defaults: ClientScope[] = [],
    mappers: ProtocolMapper[] = [],
  ) {
    this.scopes = scopes;
    this.defaults = defaults;
    this.mappers = mappers;
  }

  listScopes(): Promise<ClientScope[]> {
    return Promise.resolve(this.scopes);
  }

  findScopeByName(name: ClientScopeName): Promise<ClientScope | null> {
    return Promise.resolve(
      this.scopes.find((scope) => scope.name.equals(name)) ?? null,
    );
  }

  defaultScopes(): Promise<ClientScope[]> {
    return Promise.resolve(this.defaults);
  }

  assignDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void> {
    this.assigned.push({
      clientUuid: clientUuid.toString(),
      scopeId: scopeId.toString(),
    });
    return Promise.resolve();
  }

  removeDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void> {
    this.removed.push({
      clientUuid: clientUuid.toString(),
      scopeId: scopeId.toString(),
    });
    return Promise.resolve();
  }

  listMappers(): Promise<ProtocolMapper[]> {
    return Promise.resolve(this.mappers);
  }
}
