import type { ClientSummary } from "../../src/domain/client/client-summary.js";
import { ClientId } from "../../src/domain/shared/client-id.js";
import { ClientUuid } from "../../src/domain/shared/client-uuid.js";

export function aClient(
  clientId: string,
  uuid = "c0ffee00-1234-4035-95a5-237a748eec03",
): ClientSummary {
  return {
    uuid: ClientUuid.fromString(uuid),
    clientId: ClientId.fromString(clientId),
    enabled: true,
    publicClient: false,
  };
}
