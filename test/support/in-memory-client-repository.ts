import type { ClientSummary } from "../../src/domain/client/client-summary.js";
import type { ClientRepository } from "../../src/domain/ports/client-repository.js";
import type { ClientId } from "../../src/domain/shared/client-id.js";
import { ClientSecret } from "../../src/domain/shared/client-secret.js";
import type { ClientUuid } from "../../src/domain/shared/client-uuid.js";

export class InMemoryClientRepository implements ClientRepository {
  readonly regeneratedUuids: string[] = [];
  private readonly clients: ClientSummary[];
  private readonly secrets: Map<string, string>;

  constructor(
    clients: ClientSummary[] = [],
    secrets: Record<string, string> = {},
  ) {
    this.clients = clients;
    this.secrets = new Map(Object.entries(secrets));
  }

  list(): Promise<ClientSummary[]> {
    return Promise.resolve(this.clients);
  }

  findByClientId(clientId: ClientId): Promise<ClientSummary | null> {
    return Promise.resolve(
      this.clients.find((client) => client.clientId.equals(clientId)) ?? null,
    );
  }

  getSecret(uuid: ClientUuid): Promise<ClientSecret> {
    return Promise.resolve(
      ClientSecret.fromString(this.secrets.get(uuid.toString()) ?? "secret"),
    );
  }

  regenerateSecret(uuid: ClientUuid): Promise<ClientSecret> {
    this.regeneratedUuids.push(uuid.toString());
    return Promise.resolve(ClientSecret.fromString("new-secret"));
  }
}
