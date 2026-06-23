import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { Confirmer } from "../../../domain/ports/confirmer.js";
import {
  ElicitationConfirmer,
  type ElicitRequest,
  type ElicitResponse,
} from "./elicitation-confirmer.js";
import { ParamConfirmer } from "./param-confirmer.js";

export interface ConfirmerFactory {
  create(providedConfirm: boolean): Confirmer;
}

/**
 * Chooses the elicitation confirmer when the connected client advertises the
 * capability, otherwise falls back to the explicit `confirm` parameter.
 */
export class McpConfirmerFactory implements ConfirmerFactory {
  constructor(private readonly server: McpServer) {}

  create(providedConfirm: boolean): Confirmer {
    const capabilities = this.server.server.getClientCapabilities();
    if (capabilities?.elicitation !== undefined) {
      return new ElicitationConfirmer(
        (request: ElicitRequest) =>
          this.server.server.elicitInput(
            request as unknown as Parameters<
              McpServer["server"]["elicitInput"]
            >[0],
          ) as unknown as Promise<ElicitResponse>,
      );
    }
    return new ParamConfirmer(providedConfirm);
  }
}
