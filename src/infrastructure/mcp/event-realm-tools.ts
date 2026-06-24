import { z } from "zod";

import { GetAdminEventsUseCase } from "../../application/events/get-admin-events.use-case.js";
import { GetLoginEventsUseCase } from "../../application/events/get-login-events.use-case.js";
import { GetRealmConfigUseCase } from "../../application/realm/get-realm-config.use-case.js";
import { GetServerInfoUseCase } from "../../application/realm/get-server-info.use-case.js";
import type { EventQuery } from "../../domain/event/events.js";
import type { EventLog } from "../../domain/ports/event-log.js";
import type { RealmInfo } from "../../domain/ports/realm-info.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface EventRealmToolDeps {
  readonly eventLog: EventLog;
  readonly realmInfo: RealmInfo;
}

const REALM_FIELDS = [
  "realm",
  "enabled",
  "registrationAllowed",
  "resetPasswordAllowed",
  "verifyEmail",
  "loginWithEmailAllowed",
  "bruteForceProtected",
  "sslRequired",
  "accessTokenLifespan",
  "ssoSessionIdleTimeout",
  "ssoSessionMaxLifespan",
];

const READ_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
} as const;

function pick(
  record: Record<string, unknown>,
  keys: string[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (key in record) {
      out[key] = record[key];
    }
  }
  return out;
}

function serverSummary(info: Record<string, unknown>): Record<string, unknown> {
  const systemInfo = info.systemInfo;
  const version =
    typeof systemInfo === "object" &&
    systemInfo !== null &&
    "version" in systemInfo
      ? (systemInfo as Record<string, unknown>).version
      : null;
  return { keycloakVersion: version };
}

function eventQuery(args: Record<string, unknown>): EventQuery {
  const query: { max: number; type?: string; user?: string } = {
    max: typeof args.max === "number" ? args.max : 20,
  };
  if (typeof args.type === "string") {
    query.type = args.type;
  }
  if (typeof args.user === "string") {
    query.user = args.user;
  }
  return query;
}

function loginEventsTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_events_login",
    title: "List login events",
    description:
      "Read-only. Returns recent user login events from the realm's login event log (such as LOGIN, LOGIN_ERROR, and LOGOUT), as a JSON array ordered by the event log's default ordering. Use this to audit authentication activity or investigate failed logins; for administrative changes (user/role/config updates) use keycloak_events_admin instead. This tool is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {
      max: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Maximum number of login events to return. Integer between 1 and 500. Defaults to 20 when omitted.",
        ),
      type: z
        .string()
        .optional()
        .describe(
          "Optional Keycloak login event type to filter by, e.g. 'LOGIN', 'LOGIN_ERROR', or 'LOGOUT'. When omitted, events of all types are returned.",
        ),
      user: z
        .string()
        .optional()
        .describe(
          "Optional Keycloak user ID (UUID) to restrict results to a single user. When omitted, events for all users are returned.",
        ),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const events = await new GetLoginEventsUseCase(deps.eventLog).execute(
        eventQuery(args),
      );
      return textResult(JSON.stringify(events, null, 2));
    },
  };
}

function adminEventsTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_events_admin",
    title: "List admin events",
    description:
      "Read-only. Returns recent administrative events from the realm's admin event log (such as CREATE, UPDATE, and DELETE operations on users, roles, clients, and configuration) as a JSON array. Use this to audit who changed what in the realm; for end-user authentication activity use keycloak_events_login instead. This tool is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {
      max: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Maximum number of admin events to return. Integer between 1 and 500. Defaults to 20 when omitted.",
        ),
    },
    annotations: READ_ANNOTATIONS,
    async handler(args) {
      const events = await new GetAdminEventsUseCase(deps.eventLog).execute(
        eventQuery(args),
      );
      return textResult(JSON.stringify(events, null, 2));
    },
  };
}

function realmConfigTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_realm_get_config",
    title: "Get realm configuration",
    description:
      "Read-only. Returns a curated subset of the realm's configuration as a JSON object, including realm name and enabled state, self-registration and password-reset flags, email verification and login-with-email settings, brute-force protection, the SSL requirement, and token and SSO session lifespans. Use this to inspect security-relevant realm settings without retrieving the full realm representation. Takes no parameters; it is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: READ_ANNOTATIONS,
    async handler() {
      const config = await new GetRealmConfigUseCase(deps.realmInfo).execute();
      return textResult(JSON.stringify(pick(config, REALM_FIELDS), null, 2));
    },
  };
}

function serverInfoTool(deps: EventRealmToolDeps): ToolDefinition {
  return {
    name: "keycloak_server_info",
    title: "Get server info",
    description:
      "Read-only. Returns a small JSON summary of the connected Keycloak server, containing the 'keycloakVersion' field (the server version, or null when it cannot be determined). Use this for a quick connectivity and version check; for realm-specific settings use keycloak_realm_get_config instead. Takes no parameters; it is idempotent and never modifies Keycloak.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: READ_ANNOTATIONS,
    async handler() {
      const info = await new GetServerInfoUseCase(deps.realmInfo).execute();
      return textResult(JSON.stringify(serverSummary(info), null, 2));
    },
  };
}

export function buildEventRealmTools(
  deps: EventRealmToolDeps,
): ToolDefinition[] {
  return [
    loginEventsTool(deps),
    adminEventsTool(deps),
    realmConfigTool(deps),
    serverInfoTool(deps),
  ];
}
