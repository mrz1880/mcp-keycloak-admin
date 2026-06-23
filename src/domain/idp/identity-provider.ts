import type { IdpAlias } from "../shared/idp-alias.js";

export interface IdentityProvider {
  readonly alias: IdpAlias;
  readonly providerId: string;
  readonly enabled: boolean;
  readonly displayName: string | null;
}

export interface NewIdentityProvider {
  readonly alias: IdpAlias;
  readonly providerId: string;
  readonly enabled: boolean;
  readonly config: Record<string, string>;
}

export interface IdpMapper {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}
