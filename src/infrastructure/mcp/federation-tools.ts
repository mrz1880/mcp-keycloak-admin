import { z } from "zod";

import { GetFederationProviderUseCase } from "../../application/federation/get-federation-provider.use-case.js";
import { ListFederationProvidersUseCase } from "../../application/federation/list-federation-providers.use-case.js";
import { SyncFederationUseCase } from "../../application/federation/sync-federation.use-case.js";
import type { FederationProvider } from "../../domain/federation/federation-provider.js";
import type { FederationRepository } from "../../domain/ports/federation-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { ComponentId } from "../../domain/shared/component-id.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface FederationToolDeps {
  readonly federationRepository: FederationRepository;
}

function serializeProvider(
  provider: FederationProvider,
): Record<string, unknown> {
  return {
    id: provider.id.toString(),
    name: provider.name,
    providerId: provider.providerId,
  };
}

function listFederationTool(deps: FederationToolDeps): ToolDefinition {
  return {
    name: "keycloak_federation_list",
    title: "List user federation providers",
    description: "List the realm's user federation (LDAP/Kerberos) providers.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const providers = await new ListFederationProvidersUseCase(
        deps.federationRepository,
      ).execute();
      return textResult(
        JSON.stringify(providers.map(serializeProvider), null, 2),
      );
    },
  };
}

function getFederationTool(deps: FederationToolDeps): ToolDefinition {
  return {
    name: "keycloak_federation_get",
    title: "Get a user federation provider",
    description: "Fetch a user federation provider by id.",
    level: ToolLevel.Read,
    inputSchema: { id: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const provider = await new GetFederationProviderUseCase(
        deps.federationRepository,
      ).execute(ComponentId.fromString(String(args.id)));
      return textResult(
        provider === null
          ? "Federation provider not found."
          : JSON.stringify(serializeProvider(provider), null, 2),
      );
    },
  };
}

function syncFederationTool(deps: FederationToolDeps): ToolDefinition {
  return {
    name: "keycloak_federation_sync",
    title: "Synchronize a user federation provider",
    description:
      "Trigger a user sync from a federation provider (full or changed).",
    level: ToolLevel.Write,
    inputSchema: {
      id: z.string(),
      mode: z.enum(["full", "changed"]).optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const mode = args.mode === "full" ? "full" : "changed";
      const result = await new SyncFederationUseCase(
        deps.federationRepository,
      ).execute({ id: ComponentId.fromString(String(args.id)), mode });
      return textResult(JSON.stringify(result, null, 2));
    },
  };
}

export function buildFederationTools(
  deps: FederationToolDeps,
): ToolDefinition[] {
  return [
    listFederationTool(deps),
    getFederationTool(deps),
    syncFederationTool(deps),
  ];
}
