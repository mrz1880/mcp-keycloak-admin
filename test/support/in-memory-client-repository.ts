import type { ClientSummary } from "../../src/domain/client/client-summary.js";
import type {
  ClientUpdate,
  NewClient,
} from "../../src/domain/client/new-client.js";
import type { ClientRepository } from "../../src/domain/ports/client-repository.js";
import type { ClientId } from "../../src/domain/shared/client-id.js";
import { ClientSecret } from "../../src/domain/shared/client-secret.js";
import type { ClientUuid } from "../../src/domain/shared/client-uuid.js";

export class InMemoryClientRepository implements ClientRepository {
  readonly regeneratedUuids: string[] = [];
  readonly created: NewClient[] = [];
  readonly updated: { uuid: string; changes: ClientUpdate }[] = [];
  readonly deletedUuids: string[] = [];
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

  create(client: NewClient): Promise<void> {
    this.created.push(client);
    return Promise.resolve();
  }

  update(uuid: ClientUuid, changes: ClientUpdate): Promise<void> {
    this.updated.push({ uuid: uuid.toString(), changes });
    return Promise.resolve();
  }

  delete(uuid: ClientUuid): Promise<void> {
    this.deletedUuids.push(uuid.toString());
    return Promise.resolve();
  }
}
