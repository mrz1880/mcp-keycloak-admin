import type { IdentityProvider } from "../../src/domain/idp/identity-provider.js";
import { IdpAlias } from "../../src/domain/shared/idp-alias.js";

export function anIdp(alias: string, providerId = "oidc"): IdentityProvider {
  return {
    alias: IdpAlias.fromString(alias),
    providerId,
    enabled: true,
    displayName: null,
  };
}
