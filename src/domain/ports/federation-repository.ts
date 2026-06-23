import type {
  FederationProvider,
  SyncMode,
  SyncResult,
} from "../federation/federation-provider.js";
import type { ComponentId } from "../shared/component-id.js";

export interface FederationRepository {
  list(): Promise<FederationProvider[]>;
  find(id: ComponentId): Promise<FederationProvider | null>;
  sync(id: ComponentId, mode: SyncMode): Promise<SyncResult>;
}
