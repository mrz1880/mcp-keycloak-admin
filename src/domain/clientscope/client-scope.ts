import type { ClientScopeId } from "../shared/client-scope-id.js";
import type { ClientScopeName } from "../shared/client-scope-name.js";

export interface ClientScope {
  readonly id: ClientScopeId;
  readonly name: ClientScopeName;
  readonly protocol: string;
}

export interface ProtocolMapper {
  readonly id: string;
  readonly name: string;
  readonly protocol: string;
  readonly type: string;
}
