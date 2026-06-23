import type { IdentityProvider } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";

export class ListIdentityProvidersUseCase {
  constructor(private readonly idps: IdentityProviderRepository) {}

  execute(): Promise<IdentityProvider[]> {
    return this.idps.list();
  }
}
