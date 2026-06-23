import type { ClientId } from "../shared/client-id.js";

export interface NewClient {
  readonly clientId: ClientId;
  readonly enabled: boolean;
  readonly publicClient: boolean;
  readonly redirectUris: string[];
}

export interface ClientUpdate {
  readonly enabled?: boolean;
  readonly publicClient?: boolean;
  readonly redirectUris?: string[];
}
