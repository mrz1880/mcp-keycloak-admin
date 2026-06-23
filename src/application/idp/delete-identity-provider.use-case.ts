import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import type { IdpAlias } from "../../domain/shared/idp-alias.js";

export interface DeleteIdentityProviderResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteIdentityProviderUseCase {
  constructor(
    private readonly idps: IdentityProviderRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(alias: IdpAlias): Promise<DeleteIdentityProviderResult> {
    const operation = DestructiveOperation.of(
      `Delete identity provider ${alias.toString()}`,
      "Users who authenticate through this provider can no longer log in via " +
        "it, and their federated links are removed. This is irreversible.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }
    await this.idps.delete(alias);
    return { deleted: true };
  }
}
