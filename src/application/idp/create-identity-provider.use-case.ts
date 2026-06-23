import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import type { NewIdentityProvider } from "../../domain/idp/identity-provider.js";

export class CreateIdentityProviderUseCase {
  constructor(private readonly idps: IdentityProviderRepository) {}

  execute(idp: NewIdentityProvider): Promise<void> {
    return this.idps.create(idp);
  }
}
