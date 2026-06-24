import { z } from "zod";

import { AssignClientScopeUseCase } from "../../application/clientscopes/assign-client-scope.use-case.js";
import { GetClientDefaultScopesUseCase } from "../../application/clientscopes/get-client-default-scopes.use-case.js";
import { ListClientMappersUseCase } from "../../application/clientscopes/list-client-mappers.use-case.js";
import { ListClientScopesUseCase } from "../../application/clientscopes/list-client-scopes.use-case.js";
import { RemoveClientScopeUseCase } from "../../application/clientscopes/remove-client-scope.use-case.js";
import type { ClientScope } from "../../domain/clientscope/client-scope.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { ClientId } from "../../domain/shared/client-id.js";
import { ClientScopeName } from "../../domain/shared/client-scope-name.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface ClientScopeToolDeps {
  readonly clientRepository: ClientRepository;
  readonly clientScopeRepository: ClientScopeRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeScope(scope: ClientScope): Record<string, unknown> {
  return {
    id: scope.id.toString(),
    name: scope.name.toString(),
    protocol: scope.protocol,
  };
}

function listScopesTool(deps: ClientScopeToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_scopes_list",
    title: "List client scopes",
    description:
      "Lists every client scope defined in the realm. This is a read-only, idempotent operation that takes no parameters and does not modify Keycloak. Use it to discover available scope names before calling keycloak_client_scope_assign or keycloak_client_scope_unassign. Returns a JSON array where each entry holds the scope's id, name, and protocol.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const scopes = await new ListClientScopesUseCase(
        deps.clientScopeRepository,
      ).execute();
      return textResult(JSON.stringify(scopes.map(serializeScope), null, 2));
    },
  };
}

function defaultScopesTool(deps: ClientScopeToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_default_scopes_get",
    title: "Get a client's default scopes",
    description:
      'Lists the default client scopes currently assigned to a single client. This is a read-only, idempotent operation that does not modify Keycloak. Use it to inspect a client\'s effective default scopes before assigning or unassigning one; for the full catalog of available scopes use keycloak_client_scopes_list instead. Returns a JSON array of the assigned scopes (each with id, name, and protocol), or the text "Client not found." when no client matches the given clientId.',
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          'The internal Keycloak UUID of the client (the "id" field, not the human-readable clientId), for example "a1b2c3d4-5678-90ab-cdef-1234567890ab". Required.',
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const scopes = await new GetClientDefaultScopesUseCase(
        deps.clientRepository,
        deps.clientScopeRepository,
      ).execute(ClientId.fromString(String(args.clientId)));
      return textResult(
        scopes === null
          ? "Client not found."
          : JSON.stringify(scopes.map(serializeScope), null, 2),
      );
    },
  };
}

function listMappersTool(deps: ClientScopeToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_mappers_list",
    title: "List client protocol mappers",
    description:
      'Lists the protocol mappers configured on a single client, aggregated across the client and its assigned scopes. This is a read-only, idempotent operation that does not modify Keycloak. Use it to inspect how tokens issued for the client are shaped; to first find a client\'s scopes use keycloak_client_default_scopes_get. Returns the protocol mappers as a JSON array, or the text "Client not found." when no client matches the given clientId.',
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          'The internal Keycloak UUID of the client (the "id" field, not the human-readable clientId), for example "a1b2c3d4-5678-90ab-cdef-1234567890ab". Required.',
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const mappers = await new ListClientMappersUseCase(
        deps.clientRepository,
        deps.clientScopeRepository,
      ).execute(ClientId.fromString(String(args.clientId)));
      return textResult(
        mappers === null
          ? "Client not found."
          : JSON.stringify(mappers, null, 2),
      );
    },
  };
}

function assignScopeTool(deps: ClientScopeToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_scope_assign",
    title: "Assign a default scope to a client",
    description:
      'Assigns an existing realm client scope to a client as a default scope. This is a write operation; it is idempotent, so re-assigning an already-assigned scope leaves the client unchanged. Use keycloak_client_scopes_list to find a valid scope name and keycloak_client_default_scopes_get to check current assignments before calling this. Returns a confirmation message when the scope is assigned, or a message starting with "Not assigned:" with the reason (for example when the client or scope does not exist).',
    level: ToolLevel.Write,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          'The internal Keycloak UUID of the client (the "id" field, not the human-readable clientId), for example "a1b2c3d4-5678-90ab-cdef-1234567890ab". Required.',
        ),
      scope: z
        .string()
        .describe(
          'The name of an existing realm client scope to assign as a default scope, for example "profile" or "email". Must match a scope returned by keycloak_client_scopes_list. Required.',
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const result = await new AssignClientScopeUseCase(
        deps.clientRepository,
        deps.clientScopeRepository,
      ).execute({
        clientId: ClientId.fromString(String(args.clientId)),
        scope: ClientScopeName.fromString(String(args.scope)),
      });
      return textResult(
        result.assigned
          ? `Scope "${String(args.scope)}" assigned.`
          : `Not assigned: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function unassignScopeTool(deps: ClientScopeToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_scope_unassign",
    title: "Remove a default scope from a client",
    description:
      'Removes a default client scope from a client. This is a destructive write operation and is gated by an explicit confirmation step, so it does nothing unless confirm is true. It is not idempotent in effect: the first successful call detaches the scope, and a later call once the scope is gone reports that it was not removed. Use keycloak_client_default_scopes_get first to see which scopes are currently assigned. Returns a confirmation message when the scope is removed, or a message starting with "Not removed:" with the reason (for example missing confirmation, or an unknown client or scope).',
    level: ToolLevel.Destructive,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          'The internal Keycloak UUID of the client (the "id" field, not the human-readable clientId), for example "a1b2c3d4-5678-90ab-cdef-1234567890ab". Required.',
        ),
      scope: z
        .string()
        .describe(
          'The name of the default client scope to remove from the client, for example "profile". Should match a scope currently returned by keycloak_client_default_scopes_get. Required.',
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Explicit confirmation flag for this destructive removal. Must be set to true to actually detach the scope; when omitted or false the tool declines and reports that the change was not confirmed. Defaults to false.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new RemoveClientScopeUseCase(
        deps.clientRepository,
        deps.clientScopeRepository,
        confirmer,
      ).execute({
        clientId: ClientId.fromString(String(args.clientId)),
        scope: ClientScopeName.fromString(String(args.scope)),
      });
      return textResult(
        result.removed
          ? `Scope "${String(args.scope)}" removed.`
          : `Not removed: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildClientScopeTools(
  deps: ClientScopeToolDeps,
): ToolDefinition[] {
  return [
    listScopesTool(deps),
    defaultScopesTool(deps),
    listMappersTool(deps),
    assignScopeTool(deps),
    unassignScopeTool(deps),
  ];
}
