import type { RealmInfo } from "../../domain/ports/realm-info.js";
import type { KeycloakAdminClient } from "./admin-client.js";

export class KeycloakRealmInfo implements RealmInfo {
  constructor(private readonly client: KeycloakAdminClient) {}

  getRealmConfig(): Promise<Record<string, unknown>> {
    return this.client.getJson<Record<string, unknown>>("");
  }

  serverInfo(): Promise<Record<string, unknown>> {
    return this.client.getAdminJson<Record<string, unknown>>("/serverinfo");
  }
}
