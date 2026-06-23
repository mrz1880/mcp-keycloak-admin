import type { ClientScope } from "../../src/domain/clientscope/client-scope.js";
import { ClientScopeId } from "../../src/domain/shared/client-scope-id.js";
import { ClientScopeName } from "../../src/domain/shared/client-scope-name.js";

export function aClientScope(
  name: string,
  id = "5c0fe000-1234-4035-95a5-237a748eec03",
): ClientScope {
  return {
    id: ClientScopeId.fromString(id),
    name: ClientScopeName.fromString(name),
    protocol: "openid-connect",
  };
}
