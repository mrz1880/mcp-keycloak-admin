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
    description: "List the realm's client scopes.",
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
    description: "List the default client scopes assigned to a client.",
    level: ToolLevel.Read,
    inputSchema: { clientId: z.string() },
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
    description: "List a client's protocol mappers.",
    level: ToolLevel.Read,
    inputSchema: { clientId: z.string() },
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
    description: "Add a default client scope to a client.",
    level: ToolLevel.Write,
    inputSchema: { clientId: z.string(), scope: z.string() },
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
      "Remove a default client scope from a client. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: {
      clientId: z.string(),
      scope: z.string(),
      confirm: z.boolean().optional(),
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
