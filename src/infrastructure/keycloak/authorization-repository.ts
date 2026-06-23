import type { AuthzEntry } from "../../domain/authz/authorization.js";
import type { AuthorizationRepository } from "../../domain/ports/authorization-repository.js";
import type { ClientUuid } from "../../domain/shared/client-uuid.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakAuthzEntry {
  readonly id?: string;
  readonly _id?: string;
  readonly name?: string;
  readonly type?: string;
}

function toEntry(raw: KeycloakAuthzEntry): AuthzEntry {
  return {
    id: raw.id ?? raw._id ?? "",
    name: raw.name ?? "",
    type: raw.type ?? "",
  };
}

export class KeycloakAuthorizationRepository implements AuthorizationRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  private base(clientUuid: ClientUuid): string {
    return `/clients/${clientUuid.toString()}/authz/resource-server`;
  }

  async resources(clientUuid: ClientUuid): Promise<AuthzEntry[]> {
    const raw = await this.client.getJson<KeycloakAuthzEntry[]>(
      `${this.base(clientUuid)}/resource`,
    );
    return raw.map(toEntry);
  }

  async policies(clientUuid: ClientUuid): Promise<AuthzEntry[]> {
    const raw = await this.client.getJson<KeycloakAuthzEntry[]>(
      `${this.base(clientUuid)}/policy`,
    );
    return raw.map(toEntry);
  }

  async permissions(clientUuid: ClientUuid): Promise<AuthzEntry[]> {
    const raw = await this.client.getJson<KeycloakAuthzEntry[]>(
      `${this.base(clientUuid)}/permission`,
    );
    return raw.map(toEntry);
  }
}
