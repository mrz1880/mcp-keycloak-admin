import type {
  IdentityProvider,
  IdpMapper,
  NewIdentityProvider,
} from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakIdp {
  readonly alias: string;
  readonly providerId?: string;
  readonly enabled?: boolean;
  readonly displayName?: string;
}

interface KeycloakIdpMapper {
  readonly id: string;
  readonly name: string;
  readonly identityProviderMapper?: string;
}

function toIdp(raw: KeycloakIdp): IdentityProvider {
  return {
    alias: IdpAlias.fromString(raw.alias),
    providerId: raw.providerId ?? "unknown",
    enabled: raw.enabled ?? false,
    displayName: raw.displayName ?? null,
  };
}

export class KeycloakIdentityProviderRepository implements IdentityProviderRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<IdentityProvider[]> {
    const raw = await this.client.getJson<KeycloakIdp[]>(
      "/identity-provider/instances",
    );
    return raw.map(toIdp);
  }

  async find(alias: IdpAlias): Promise<IdentityProvider | null> {
    try {
      const raw = await this.client.getJson<KeycloakIdp>(
        `/identity-provider/instances/${alias.toString()}`,
      );
      return toIdp(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  create(idp: NewIdentityProvider): Promise<void> {
    return this.client.post("/identity-provider/instances", {
      alias: idp.alias.toString(),
      providerId: idp.providerId,
      enabled: idp.enabled,
      config: idp.config,
    });
  }

  delete(alias: IdpAlias): Promise<void> {
    return this.client.delete(
      `/identity-provider/instances/${alias.toString()}`,
    );
  }

  async listMappers(alias: IdpAlias): Promise<IdpMapper[]> {
    const raw = await this.client.getJson<KeycloakIdpMapper[]>(
      `/identity-provider/instances/${alias.toString()}/mappers`,
    );
    return raw.map((mapper) => ({
      id: mapper.id,
      name: mapper.name,
      type: mapper.identityProviderMapper ?? "unknown",
    }));
  }
}
