import type { ClientId } from "../shared/client-id.js";
import type { ClientUuid } from "../shared/client-uuid.js";

/** Read model of a Keycloak client (application). */
export interface ClientSummary {
  readonly uuid: ClientUuid;
  readonly clientId: ClientId;
  readonly enabled: boolean;
  readonly publicClient: boolean;
}
