import { z } from "zod";

import { GetClientSecretUseCase } from "../../application/clients/get-client-secret.use-case.js";
import { GetClientUseCase } from "../../application/clients/get-client.use-case.js";
import { ListClientsUseCase } from "../../application/clients/list-clients.use-case.js";
import { RegenerateClientSecretUseCase } from "../../application/clients/regenerate-client-secret.use-case.js";
import type { ClientSummary } from "../../domain/client/client-summary.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { ClientId } from "../../domain/shared/client-id.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface ClientToolDeps {
  readonly clientRepository: ClientRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeClient(client: ClientSummary): Record<string, unknown> {
  return {
    uuid: client.uuid.toString(),
    clientId: client.clientId.toString(),
    enabled: client.enabled,
    publicClient: client.publicClient,
  };
}

function listClientsTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_list",
    title: "List clients",
    description: "List the realm clients.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const clients = await new ListClientsUseCase(
        deps.clientRepository,
      ).execute();
      return textResult(JSON.stringify(clients.map(serializeClient), null, 2));
    },
  };
}

function getClientTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_get",
    title: "Get client",
    description: "Fetch a client by its clientId.",
    level: ToolLevel.Read,
    inputSchema: { clientId: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const client = await new GetClientUseCase(deps.clientRepository).execute(
        ClientId.fromString(String(args.clientId)),
      );
      return textResult(
        client === null
          ? "Client not found."
          : JSON.stringify(serializeClient(client), null, 2),
      );
    },
  };
}

function getClientSecretTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_get_secret",
    title: "Get client secret",
    description:
      "Read a confidential client's secret. Masked unless reveal is true.",
    level: ToolLevel.Read,
    inputSchema: { clientId: z.string(), reveal: z.boolean().optional() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const secret = await new GetClientSecretUseCase(
        deps.clientRepository,
      ).execute(ClientId.fromString(String(args.clientId)));
      if (secret === null) {
        return textResult("Client not found.");
      }
      return textResult(
        args.reveal === true ? secret.reveal() : secret.masked(),
      );
    },
  };
}

function regenerateClientSecretTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_regenerate_secret",
    title: "Regenerate client secret",
    description:
      "Regenerate a confidential client's secret. Requires confirmation; the " +
      "old secret stops working.",
    level: ToolLevel.Destructive,
    inputSchema: { clientId: z.string(), confirm: z.boolean().optional() },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new RegenerateClientSecretUseCase(
        deps.clientRepository,
        confirmer,
      ).execute(ClientId.fromString(String(args.clientId)));
      if (!result.regenerated || result.secret === undefined) {
        return textResult(
          `Not regenerated: ${result.reason ?? "unknown reason"}`,
        );
      }
      return textResult(`New secret: ${result.secret.reveal()}`);
    },
  };
}

export function buildClientTools(deps: ClientToolDeps): ToolDefinition[] {
  return [
    listClientsTool(deps),
    getClientTool(deps),
    getClientSecretTool(deps),
    regenerateClientSecretTool(deps),
  ];
}
