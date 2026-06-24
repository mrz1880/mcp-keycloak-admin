import { z } from "zod";

import { ListAuthzPermissionsUseCase } from "../../application/authz/list-authz-permissions.use-case.js";
import { ListAuthzPoliciesUseCase } from "../../application/authz/list-authz-policies.use-case.js";
import { ListAuthzResourcesUseCase } from "../../application/authz/list-authz-resources.use-case.js";
import type { AuthzEntry } from "../../domain/authz/authorization.js";
import type { AuthorizationRepository } from "../../domain/ports/authorization-repository.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { ClientId } from "../../domain/shared/client-id.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface AuthzToolDeps {
  readonly clientRepository: ClientRepository;
  readonly authorizationRepository: AuthorizationRepository;
}

type Lister = (clientId: ClientId) => Promise<AuthzEntry[] | null>;

function listTool(
  name: string,
  title: string,
  description: string,
  run: Lister,
): ToolDefinition {
  return {
    name,
    title,
    description,
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The Keycloak internal id of the client whose authorization-services configuration to read. This is the UUID-style id (clientUuid), not the human-readable clientId string; obtain it from keycloak_clients_list. Required.",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const entries = await run(ClientId.fromString(String(args.clientId)));
      return textResult(
        entries === null
          ? "Client not found."
          : JSON.stringify(entries, null, 2),
      );
    },
  };
}

export function buildAuthzTools(deps: AuthzToolDeps): ToolDefinition[] {
  return [
    listTool(
      "keycloak_authz_resources_list",
      "List authorization resources",
      "Lists the authorization-services resources defined on a Keycloak client (the protected resources that policies and permissions apply to). Read-only and idempotent: it performs no writes and returns the same data for unchanged configuration. Use it to inspect a client's fine-grained authorization model; call keycloak_clients_list first to obtain the client's internal id, and pair it with keycloak_authz_policies_list and keycloak_authz_permissions_list for the full picture. Returns a JSON array of resource entries, or the text \"Client not found.\" when no client matches the given id.",
      (clientId) =>
        new ListAuthzResourcesUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
    listTool(
      "keycloak_authz_policies_list",
      "List authorization policies",
      "Lists the authorization-services policies defined on a Keycloak client (the rules, such as role, user, or JS policies, that decide whether access is granted). Read-only and idempotent: it performs no writes and returns the same data for unchanged configuration. Use it to review the policies that back a client's permissions; call keycloak_clients_list first to obtain the client's internal id, and combine with keycloak_authz_resources_list and keycloak_authz_permissions_list to understand the whole authorization model. Returns a JSON array of policy entries, or the text \"Client not found.\" when no client matches the given id.",
      (clientId) =>
        new ListAuthzPoliciesUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
    listTool(
      "keycloak_authz_permissions_list",
      "List authorization permissions",
      "Lists the authorization-services permissions defined on a Keycloak client (the bindings that tie resources and/or scopes to the policies that govern them). Read-only and idempotent: it performs no writes and returns the same data for unchanged configuration. Use it to see how a client's resources are protected; call keycloak_clients_list first to obtain the client's internal id, and pair with keycloak_authz_resources_list and keycloak_authz_policies_list for full context. Returns a JSON array of permission entries, or the text \"Client not found.\" when no client matches the given id.",
      (clientId) =>
        new ListAuthzPermissionsUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
  ];
}
