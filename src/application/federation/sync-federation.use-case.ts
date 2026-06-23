import type { FederationRepository } from "../../domain/ports/federation-repository.js";
import type {
  SyncMode,
  SyncResult,
} from "../../domain/federation/federation-provider.js";
import type { ComponentId } from "../../domain/shared/component-id.js";

export interface SyncFederationInput {
  readonly id: ComponentId;
  readonly mode: SyncMode;
}

export class SyncFederationUseCase {
  constructor(private readonly federation: FederationRepository) {}

  execute(input: SyncFederationInput): Promise<SyncResult> {
    return this.federation.sync(input.id, input.mode);
  }
}
