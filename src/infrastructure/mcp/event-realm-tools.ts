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
    description: "Read recent login events, optionally filtered.",
    level: ToolLevel.Read,
    inputSchema: {
      max: z.number().int().min(1).max(500).optional(),
      type: z.string().optional(),
      user: z.string().optional(),
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
    description: "Read recent admin events.",
    level: ToolLevel.Read,
    inputSchema: { max: z.number().int().min(1).max(500).optional() },
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
    description: "Read key realm configuration flags.",
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
    description: "Read the Keycloak server version and profile.",
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
