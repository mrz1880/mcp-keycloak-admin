import type {
  FederationProvider,
  SyncMode,
  SyncResult,
} from "../../domain/federation/federation-provider.js";
import type { FederationRepository } from "../../domain/ports/federation-repository.js";
import { ComponentId } from "../../domain/shared/component-id.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

const PROVIDER_TYPE = "org.keycloak.storage.UserStorageProvider";

interface KeycloakComponent {
  readonly id: string;
  readonly name?: string;
  readonly providerId?: string;
}

interface KeycloakSyncResult {
  readonly status?: string;
  readonly added?: number;
  readonly updated?: number;
  readonly removed?: number;
}

function toProvider(raw: KeycloakComponent): FederationProvider {
  return {
    id: ComponentId.fromString(raw.id),
    name: raw.name ?? "unnamed",
    providerId: raw.providerId ?? "unknown",
  };
}

export class KeycloakFederationRepository implements FederationRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<FederationProvider[]> {
    const raw = await this.client.getJson<KeycloakComponent[]>("/components", {
      type: PROVIDER_TYPE,
    });
    return raw.map(toProvider);
  }

  async find(id: ComponentId): Promise<FederationProvider | null> {
    try {
      const raw = await this.client.getJson<KeycloakComponent>(
        `/components/${id.toString()}`,
      );
      return toProvider(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async sync(id: ComponentId, mode: SyncMode): Promise<SyncResult> {
    const action =
      mode === "full" ? "triggerFullSync" : "triggerChangedUsersSync";
    const raw = await this.client.postJson<KeycloakSyncResult>(
      `/user-storage/${id.toString()}/sync?action=${action}`,
    );
    return {
      status: raw.status ?? "completed",
      added: raw.added ?? 0,
      updated: raw.updated ?? 0,
      removed: raw.removed ?? 0,
    };
  }
}
