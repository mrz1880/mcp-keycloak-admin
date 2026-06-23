import { z } from "zod";

import { CreateIdentityProviderUseCase } from "../../application/idp/create-identity-provider.use-case.js";
import { DeleteIdentityProviderUseCase } from "../../application/idp/delete-identity-provider.use-case.js";
import { GetIdentityProviderUseCase } from "../../application/idp/get-identity-provider.use-case.js";
import { ListIdentityProvidersUseCase } from "../../application/idp/list-identity-providers.use-case.js";
import { ListIdpMappersUseCase } from "../../application/idp/list-idp-mappers.use-case.js";
import type { IdentityProvider } from "../../domain/idp/identity-provider.js";
import type { IdentityProviderRepository } from "../../domain/ports/identity-provider-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { IdpAlias } from "../../domain/shared/idp-alias.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface IdpToolDeps {
  readonly identityProviderRepository: IdentityProviderRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeIdp(idp: IdentityProvider): Record<string, unknown> {
  return {
    alias: idp.alias.toString(),
    providerId: idp.providerId,
    enabled: idp.enabled,
    displayName: idp.displayName,
  };
}

function readConfig(value: unknown): Record<string, string> {
  const config: Record<string, string> = {};
  if (value !== null && typeof value === "object") {
    for (const [key, entry] of Object.entries(
      value as Record<string, unknown>,
    )) {
      if (typeof entry === "string") {
        config[key] = entry;
      }
    }
  }
  return config;
}

function listIdpsTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_list",
    title: "List identity providers",
    description: "List the realm's identity providers.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const idps = await new ListIdentityProvidersUseCase(
        deps.identityProviderRepository,
      ).execute();
      return textResult(JSON.stringify(idps.map(serializeIdp), null, 2));
    },
  };
}

function getIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_get",
    title: "Get identity provider",
    description: "Fetch an identity provider by alias.",
    level: ToolLevel.Read,
    inputSchema: { alias: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const idp = await new GetIdentityProviderUseCase(
        deps.identityProviderRepository,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(
        idp === null
          ? "Identity provider not found."
          : JSON.stringify(serializeIdp(idp), null, 2),
      );
    },
  };
}

function listIdpMappersTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_mappers_list",
    title: "List identity provider mappers",
    description: "List an identity provider's mappers.",
    level: ToolLevel.Read,
    inputSchema: { alias: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const mappers = await new ListIdpMappersUseCase(
        deps.identityProviderRepository,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(JSON.stringify(mappers, null, 2));
    },
  };
}

function createIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_create",
    title: "Create identity provider",
    description:
      "Create an identity provider. `config` carries provider-specific keys " +
      "(clientId, clientSecret, authorizationUrl, …).",
    level: ToolLevel.Write,
    inputSchema: {
      alias: z.string(),
      providerId: z.string(),
      enabled: z.boolean().optional(),
      config: z.record(z.string(), z.string()).optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      await new CreateIdentityProviderUseCase(
        deps.identityProviderRepository,
      ).execute({
        alias: IdpAlias.fromString(String(args.alias)),
        providerId: String(args.providerId),
        enabled: args.enabled !== false,
        config: readConfig(args.config),
      });
      return textResult(`Identity provider "${String(args.alias)}" created.`);
    },
  };
}

function deleteIdpTool(deps: IdpToolDeps): ToolDefinition {
  return {
    name: "keycloak_idp_delete",
    title: "Delete identity provider",
    description: "Delete an identity provider. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: { alias: z.string(), confirm: z.boolean().optional() },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteIdentityProviderUseCase(
        deps.identityProviderRepository,
        confirmer,
      ).execute(IdpAlias.fromString(String(args.alias)));
      return textResult(
        result.deleted
          ? `Identity provider "${String(args.alias)}" deleted.`
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildIdpTools(deps: IdpToolDeps): ToolDefinition[] {
  return [
    listIdpsTool(deps),
    getIdpTool(deps),
    listIdpMappersTool(deps),
    createIdpTool(deps),
    deleteIdpTool(deps),
  ];
}
