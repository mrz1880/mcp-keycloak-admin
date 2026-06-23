import type { ComponentId } from "../shared/component-id.js";

export interface FederationProvider {
  readonly id: ComponentId;
  readonly name: string;
  readonly providerId: string;
}

export type SyncMode = "full" | "changed";

export interface SyncResult {
  readonly status: string;
  readonly added: number;
  readonly updated: number;
  readonly removed: number;
}
