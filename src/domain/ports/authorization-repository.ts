import type { AuthzEntry } from "../authz/authorization.js";
import type { ClientUuid } from "../shared/client-uuid.js";

export interface AuthorizationRepository {
  resources(clientUuid: ClientUuid): Promise<AuthzEntry[]>;
  policies(clientUuid: ClientUuid): Promise<AuthzEntry[]>;
  permissions(clientUuid: ClientUuid): Promise<AuthzEntry[]>;
}
