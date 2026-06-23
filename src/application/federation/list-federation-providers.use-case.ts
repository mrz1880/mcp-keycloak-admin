import type { FederationProvider } from "../../domain/federation/federation-provider.js";
import type { FederationRepository } from "../../domain/ports/federation-repository.js";

export class ListFederationProvidersUseCase {
  constructor(private readonly federation: FederationRepository) {}

  execute(): Promise<FederationProvider[]> {
    return this.federation.list();
  }
}
