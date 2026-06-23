import type { IdpMapper } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";

export class ListIdpMappersUseCase {
  constructor(private readonly idps: IdentityProviderRepository) {}

  execute(alias: IdpAlias): Promise<IdpMapper[]> {
    return this.idps.listMappers(alias);
  }
}
