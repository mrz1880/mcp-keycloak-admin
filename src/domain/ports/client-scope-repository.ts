import type {
  ClientScope,
  ProtocolMapper,
} from "../clientscope/client-scope.js";
import type { ClientScopeId } from "../shared/client-scope-id.js";
import type { ClientScopeName } from "../shared/client-scope-name.js";
import type { ClientUuid } from "../shared/client-uuid.js";

export interface ClientScopeRepository {
  listScopes(): Promise<ClientScope[]>;
  findScopeByName(name: ClientScopeName): Promise<ClientScope | null>;
  defaultScopes(clientUuid: ClientUuid): Promise<ClientScope[]>;
  assignDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void>;
  removeDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void>;
  listMappers(clientUuid: ClientUuid): Promise<ProtocolMapper[]>;
}
