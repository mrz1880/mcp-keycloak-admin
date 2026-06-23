import type { ClientSummary } from "../../domain/client/client-summary.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import { ClientId } from "../../domain/shared/client-id.js";
import { ClientSecret } from "../../domain/shared/client-secret.js";
import { ClientUuid } from "../../domain/shared/client-uuid.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakClientRep {
  readonly id: string;
  readonly clientId: string;
  readonly enabled?: boolean;
  readonly publicClient?: boolean;
}

interface SecretRep {
  readonly value: string;
}

function toSummary(raw: KeycloakClientRep): ClientSummary {
  return {
    uuid: ClientUuid.fromString(raw.id),
    clientId: ClientId.fromString(raw.clientId),
    enabled: raw.enabled ?? false,
    publicClient: raw.publicClient ?? false,
  };
}

export class KeycloakClientRepository implements ClientRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<ClientSummary[]> {
    const raw = await this.client.list<KeycloakClientRep>("/clients");
    return raw.map(toSummary);
  }

  async findByClientId(clientId: ClientId): Promise<ClientSummary | null> {
    const raw = await this.client.getJson<KeycloakClientRep[]>("/clients", {
      clientId: clientId.toString(),
    });
    const first = raw[0];
    return first === undefined ? null : toSummary(first);
  }

  async getSecret(uuid: ClientUuid): Promise<ClientSecret> {
    const raw = await this.client.getJson<SecretRep>(
      `/clients/${uuid.toString()}/client-secret`,
    );
    return ClientSecret.fromString(raw.value);
  }

  async regenerateSecret(uuid: ClientUuid): Promise<ClientSecret> {
    const raw = await this.client.postJson<SecretRep>(
      `/clients/${uuid.toString()}/client-secret`,
    );
    return ClientSecret.fromString(raw.value);
  }
}
