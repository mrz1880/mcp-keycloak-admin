import type { Confirmer } from "../../../domain/ports/confirmer.js";
import type { DestructiveOperation } from "../../../domain/policy/destructive-operation.js";

export interface ElicitRequest {
  readonly message: string;
  readonly requestedSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ElicitResponse {
  readonly action: string;
  readonly content?: Record<string, unknown>;
}

export type ElicitInput = (request: ElicitRequest) => Promise<ElicitResponse>;

/**
 * Asks the user to confirm through the MCP elicitation flow. The operation is
 * approved only when the user accepts and ticks the confirmation box.
 */
export class ElicitationConfirmer implements Confirmer {
  constructor(private readonly elicit: ElicitInput) {}

  async confirm(operation: DestructiveOperation): Promise<boolean> {
    const response = await this.elicit({
      message: operation.describe(),
      requestedSchema: {
        type: "object",
        properties: {
          confirm: {
            type: "boolean",
            title: "Confirm",
            description: "Proceed with this irreversible operation?",
          },
        },
        required: ["confirm"],
      },
    });
    return response.action === "accept" && response.content?.confirm === true;
  }
}
