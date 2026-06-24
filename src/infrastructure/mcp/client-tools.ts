import { z } from "zod";

import { CreateClientUseCase } from "../../application/clients/create-client.use-case.js";
import { DeleteClientUseCase } from "../../application/clients/delete-client.use-case.js";
import { GetClientSecretUseCase } from "../../application/clients/get-client-secret.use-case.js";
import { GetClientUseCase } from "../../application/clients/get-client.use-case.js";
import { ListClientsUseCase } from "../../application/clients/list-clients.use-case.js";
import { RegenerateClientSecretUseCase } from "../../application/clients/regenerate-client-secret.use-case.js";
import { UpdateClientUseCase } from "../../application/clients/update-client.use-case.js";
import type { ClientSummary } from "../../domain/client/client-summary.js";
import type { ClientUpdate } from "../../domain/client/new-client.js";
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
    description:
      "List all OAuth/OIDC clients registered in the configured Keycloak realm. " +
      "Read-only and idempotent; it does not modify anything. Use this to discover " +
      "clients before calling keycloak_client_get, keycloak_client_update, or " +
      "keycloak_client_delete. Takes no parameters and returns a JSON array where " +
      "each entry has uuid, clientId, enabled, and publicClient.",
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
    description:
      "Fetch a single realm client by its clientId. Read-only and idempotent; it " +
      "does not modify anything. Use keycloak_client_list first if you do not know " +
      "the exact clientId. Returns a JSON object with uuid, clientId, enabled, and " +
      'publicClient, or the text "Client not found." when no client matches.',
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The client's clientId (the human-readable OAuth/OIDC client identifier, " +
            'e.g. "account" or "my-app"), not the internal UUID. Required.',
        ),
    },
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
      "Read the current secret of a confidential (non-public) realm client. Read-only " +
      "and idempotent; it does not change the secret. By default the secret is returned " +
      "masked; pass reveal=true to return the plaintext value. Use keycloak_client_get " +
      "to confirm a client is confidential first, and keycloak_client_regenerate_secret " +
      'to rotate it. Returns the (masked or plaintext) secret string, or "Client not ' +
      'found." when no client matches.',
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The client's clientId (the human-readable OAuth/OIDC client identifier, " +
            'e.g. "my-app"), not the internal UUID. Required. The client must be ' +
            "confidential (publicClient=false) to have a secret.",
        ),
      reveal: z
        .boolean()
        .optional()
        .describe(
          "When true, return the plaintext secret; when false or omitted (default), " +
            "return a masked value. Set to true only when the caller actually needs " +
            "the raw secret.",
        ),
    },
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
      "Regenerate (rotate) a confidential client's secret. This is a destructive, " +
      "non-idempotent write: it invalidates the previous secret, which immediately " +
      "stops working, so any system using the old value must be updated. Requires " +
      "explicit confirmation via confirm=true (otherwise it aborts without changing " +
      "anything). Use keycloak_client_get_secret to read the current secret without " +
      "rotating. Returns the new plaintext secret, or a reason string when not " +
      "regenerated.",
    level: ToolLevel.Destructive,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The client's clientId (the human-readable OAuth/OIDC client identifier), " +
            "not the internal UUID. Required. The client must be confidential " +
            "(publicClient=false).",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to actually rotate the secret. When false or omitted " +
            "(default), the operation is aborted and nothing is changed; this is a " +
            "safeguard against accidental rotation.",
        ),
    },
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

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function createClientTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_create",
    title: "Create client",
    description:
      "Create a new OAuth/OIDC client in the configured realm. This is a write " +
      "operation and is not idempotent: calling it again with the same clientId " +
      "creates a conflict rather than reusing the existing client. Use " +
      "keycloak_client_list or keycloak_client_get first to verify the clientId is " +
      "not already taken, and keycloak_client_update to modify an existing client. " +
      "Returns a confirmation message naming the created client.",
    level: ToolLevel.Write,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The clientId to assign to the new client (the human-readable OAuth/OIDC " +
            'identifier, e.g. "my-app"). Required and must be unique within the realm.',
        ),
      enabled: z
        .boolean()
        .optional()
        .describe(
          "Whether the client is enabled. Defaults to true; the client is created " +
            "disabled only when this is explicitly set to false.",
        ),
      publicClient: z
        .boolean()
        .optional()
        .describe(
          "Whether the client is public (no client secret, e.g. SPA or mobile app). " +
            "Defaults to false, creating a confidential client; set to true for a " +
            "public client.",
        ),
      redirectUris: z
        .array(z.string())
        .optional()
        .describe(
          "Allowed OAuth redirect/callback URIs as a list of strings (e.g. " +
            '["https://app.example.com/callback"]). Optional; defaults to an empty ' +
            "list when omitted.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      await new CreateClientUseCase(deps.clientRepository).execute({
        clientId: ClientId.fromString(String(args.clientId)),
        enabled: args.enabled !== false,
        publicClient: args.publicClient === true,
        redirectUris: readStringArray(args.redirectUris),
      });
      return textResult(`Client "${String(args.clientId)}" created.`);
    },
  };
}

function updateClientTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_update",
    title: "Update client",
    description:
      "Update an existing client's enabled flag, public flag, and/or redirect URIs. " +
      "Only the fields you supply are changed; omitted fields are left untouched. " +
      "This is a write operation and is idempotent: applying the same values again " +
      "yields the same state. Use keycloak_client_list or keycloak_client_get to find " +
      "the client first. Returns a confirmation message, or a reason string (e.g. when " +
      "the client does not exist).",
    level: ToolLevel.Write,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The clientId of the existing client to update (the human-readable " +
            "OAuth/OIDC identifier), not the internal UUID. Required; identifies the " +
            "target and is not itself changed.",
        ),
      enabled: z
        .boolean()
        .optional()
        .describe(
          "New enabled state for the client. Omit to leave the current value " +
            "unchanged; the change is applied only when a boolean is provided.",
        ),
      publicClient: z
        .boolean()
        .optional()
        .describe(
          "New public/confidential flag (true = public, false = confidential). Omit " +
            "to leave the current value unchanged.",
        ),
      redirectUris: z
        .array(z.string())
        .optional()
        .describe(
          "New full list of allowed redirect/callback URIs, replacing the existing " +
            "list. Omit to leave the current URIs unchanged; pass an empty array to " +
            "clear them.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const changes: {
        enabled?: boolean;
        publicClient?: boolean;
        redirectUris?: string[];
      } = {};
      if (typeof args.enabled === "boolean") {
        changes.enabled = args.enabled;
      }
      if (typeof args.publicClient === "boolean") {
        changes.publicClient = args.publicClient;
      }
      if (Array.isArray(args.redirectUris)) {
        changes.redirectUris = readStringArray(args.redirectUris);
      }
      const result = await new UpdateClientUseCase(
        deps.clientRepository,
      ).execute({
        clientId: ClientId.fromString(String(args.clientId)),
        changes: changes satisfies ClientUpdate,
      });
      return textResult(
        result.updated
          ? `Client "${String(args.clientId)}" updated.`
          : `Not updated: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function deleteClientTool(deps: ClientToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_delete",
    title: "Delete client",
    description:
      "Permanently delete a client from the realm. This is a destructive operation and " +
      "is not idempotent: once deleted, deleting the same clientId again fails because " +
      "it no longer exists. Requires explicit confirmation via confirm=true (otherwise " +
      "it aborts without deleting). Use keycloak_client_get to verify the target first, " +
      "and keycloak_client_update to merely disable a client instead of removing it. " +
      "Returns a confirmation message, or a reason string when not deleted.",
    level: ToolLevel.Destructive,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The clientId of the client to delete (the human-readable OAuth/OIDC " +
            "identifier), not the internal UUID. Required.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to actually delete the client. When false or omitted " +
            "(default), the operation is aborted and nothing is removed; this guards " +
            "against accidental deletion.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteClientUseCase(
        deps.clientRepository,
        confirmer,
      ).execute(ClientId.fromString(String(args.clientId)));
      return textResult(
        result.deleted
          ? `Client "${String(args.clientId)}" deleted.`
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildClientTools(deps: ClientToolDeps): ToolDefinition[] {
  return [
    listClientsTool(deps),
    getClientTool(deps),
    getClientSecretTool(deps),
    createClientTool(deps),
    updateClientTool(deps),
    regenerateClientSecretTool(deps),
    deleteClientTool(deps),
  ];
}
