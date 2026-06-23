import type {
  FederationProvider,
  SyncMode,
  SyncResult,
} from "../../src/domain/federation/federation-provider.js";
import type { FederationRepository } from "../../src/domain/ports/federation-repository.js";
import type { ComponentId } from "../../src/domain/shared/component-id.js";

export class InMemoryFederationRepository implements FederationRepository {
  readonly synced: { id: string; mode: SyncMode }[] = [];
  private readonly providers: FederationProvider[];

  constructor(providers: FederationProvider[] = []) {
    this.providers = providers;
  }

  list(): Promise<FederationProvider[]> {
    return Promise.resolve(this.providers);
  }

  find(id: ComponentId): Promise<FederationProvider | null> {
    return Promise.resolve(
      this.providers.find((provider) => provider.id.equals(id)) ?? null,
    );
  }

  sync(id: ComponentId, mode: SyncMode): Promise<SyncResult> {
    this.synced.push({ id: id.toString(), mode });
    return Promise.resolve({
      status: "completed",
      added: 1,
      updated: 0,
      removed: 0,
    });
  }
}
