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
    inputSchema: { clientId: z.string() },
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
      "List a client's authorization-services resources.",
      (clientId) =>
        new ListAuthzResourcesUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
    listTool(
      "keycloak_authz_policies_list",
      "List authorization policies",
      "List a client's authorization-services policies.",
      (clientId) =>
        new ListAuthzPoliciesUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
    listTool(
      "keycloak_authz_permissions_list",
      "List authorization permissions",
      "List a client's authorization-services permissions.",
      (clientId) =>
        new ListAuthzPermissionsUseCase(
          deps.clientRepository,
          deps.authorizationRepository,
        ).execute(clientId),
    ),
  ];
}
