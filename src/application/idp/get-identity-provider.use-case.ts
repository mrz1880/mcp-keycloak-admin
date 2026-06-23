import type { IdentityProvider } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";

export class GetIdentityProviderUseCase {
  constructor(private readonly idps: IdentityProviderRepository) {}

  execute(alias: IdpAlias): Promise<IdentityProvider | null> {
    return this.idps.find(alias);
  }
}
