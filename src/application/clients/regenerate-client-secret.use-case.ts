import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientId } from "../../domain/shared/client-id.js";
import type { ClientSecret } from "../../domain/shared/client-secret.js";

export interface RegenerateClientSecretResult {
  readonly regenerated: boolean;
  readonly secret?: ClientSecret;
  readonly reason?: string;
}

export class RegenerateClientSecretUseCase {
  constructor(
    private readonly clients: ClientRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(clientId: ClientId): Promise<RegenerateClientSecretResult> {
    const client = await this.clients.findByClientId(clientId);
    if (client === null) {
      return { regenerated: false, reason: "Client not found" };
    }

    const operation = DestructiveOperation.of(
      `Regenerate secret for client ${clientId.toString()}`,
      "Any service still using the old secret will fail to authenticate until " +
        "it is updated with the new one.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { regenerated: false, reason: "Operation not confirmed" };
    }

    const secret = await this.clients.regenerateSecret(client.uuid);
    return { regenerated: true, secret };
  }
}
