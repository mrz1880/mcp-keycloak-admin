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
    description:
      "Lists all user federation providers (such as LDAP or Kerberos) configured in the current realm. Read-only and idempotent; it does not modify any configuration. Use this to discover available providers and obtain their ids before calling keycloak_federation_get for details or keycloak_federation_sync to trigger a sync. Returns a JSON array where each entry contains the provider id, name, and providerId; an empty array means no providers are configured.",
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
    description:
      'Fetches a single user federation provider (such as LDAP or Kerberos) by its component id in the current realm. Read-only and idempotent; it does not modify any configuration. Use keycloak_federation_list first to obtain a valid id, then call this tool to inspect that specific provider. Returns a JSON object with the provider id, name, and providerId, or the text "Federation provider not found." when no provider matches the given id.',
    level: ToolLevel.Read,
    inputSchema: {
      id: z
        .string()
        .describe(
          'Component id of the federation provider to fetch (a Keycloak component UUID, e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479"). Obtain it from keycloak_federation_list. Required.',
        ),
    },
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
      "Triggers a user synchronization from a user federation provider (such as LDAP) into the current realm. This is a write operation that imports or updates users; it is not destructive but is not idempotent, since each call re-runs the sync and the imported counts can differ between runs. Use keycloak_federation_list or keycloak_federation_get first to confirm the provider id, then run this to refresh users. Returns a JSON object describing the sync result reported by Keycloak.",
    level: ToolLevel.Write,
    inputSchema: {
      id: z
        .string()
        .describe(
          'Component id of the federation provider to synchronize (a Keycloak component UUID, e.g. "f47ac10b-58cc-4372-a567-0e02b2c3d479"). Obtain it from keycloak_federation_list. Required.',
        ),
      mode: z
        .enum(["full", "changed"])
        .optional()
        .describe(
          'Synchronization scope: "full" re-imports every user from the provider, while "changed" imports only users added or changed since the last sync. Optional; when omitted or set to any value other than "full", the handler defaults to "changed".',
        ),
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
