import type { IdentityProviderRepository } from "../../src/domain/ports/identity-provider-repository.js";
import type {
  IdentityProvider,
  IdpMapper,
  NewIdentityProvider,
} from "../../src/domain/idp/identity-provider.js";
import type { IdpAlias } from "../../src/domain/shared/idp-alias.js";

export class InMemoryIdentityProviderRepository implements IdentityProviderRepository {
  readonly created: NewIdentityProvider[] = [];
  readonly deletedAliases: string[] = [];
  private readonly idps: IdentityProvider[];
  private readonly mappers: IdpMapper[];

  constructor(idps: IdentityProvider[] = [], mappers: IdpMapper[] = []) {
    this.idps = idps;
    this.mappers = mappers;
  }

  list(): Promise<IdentityProvider[]> {
    return Promise.resolve(this.idps);
  }

  find(alias: IdpAlias): Promise<IdentityProvider | null> {
    return Promise.resolve(
      this.idps.find((idp) => idp.alias.equals(alias)) ?? null,
    );
  }

  create(idp: NewIdentityProvider): Promise<void> {
    this.created.push(idp);
    return Promise.resolve();
  }

  delete(alias: IdpAlias): Promise<void> {
    this.deletedAliases.push(alias.toString());
    return Promise.resolve();
  }

  listMappers(): Promise<IdpMapper[]> {
    return Promise.resolve(this.mappers);
  }
}
