import type { ClientSummary } from "../client/client-summary.js";
import type { ClientId } from "../shared/client-id.js";
import type { ClientSecret } from "../shared/client-secret.js";
import type { ClientUuid } from "../shared/client-uuid.js";

export interface ClientRepository {
  list(): Promise<ClientSummary[]>;
  findByClientId(clientId: ClientId): Promise<ClientSummary | null>;
  getSecret(uuid: ClientUuid): Promise<ClientSecret>;
  regenerateSecret(uuid: ClientUuid): Promise<ClientSecret>;
}
