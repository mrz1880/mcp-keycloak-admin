import type { FederationProvider } from "../../domain/federation/federation-provider.js";
import type { FederationRepository } from "../../domain/ports/federation-repository.js";
import type { ComponentId } from "../../domain/shared/component-id.js";

export class GetFederationProviderUseCase {
  constructor(private readonly federation: FederationRepository) {}

  execute(id: ComponentId): Promise<FederationProvider | null> {
    return this.federation.find(id);
  }
}
