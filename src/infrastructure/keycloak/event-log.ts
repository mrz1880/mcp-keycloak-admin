import type { EventLog } from "../../domain/ports/event-log.js";
import type {
  AdminEvent,
  EventQuery,
  LoginEvent,
} from "../../domain/event/events.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakLoginEvent {
  readonly time?: number;
  readonly type?: string;
  readonly userId?: string;
  readonly ipAddress?: string;
}

interface KeycloakAdminEvent {
  readonly time?: number;
  readonly operationType?: string;
  readonly resourceType?: string;
  readonly resourcePath?: string;
}

function toLoginEvent(raw: KeycloakLoginEvent): LoginEvent {
  return {
    time: raw.time ?? 0,
    type: raw.type ?? "UNKNOWN",
    userId: raw.userId ?? null,
    ipAddress: raw.ipAddress ?? null,
  };
}

function toAdminEvent(raw: KeycloakAdminEvent): AdminEvent {
  return {
    time: raw.time ?? 0,
    operationType: raw.operationType ?? "UNKNOWN",
    resourceType: raw.resourceType ?? "UNKNOWN",
    resourcePath: raw.resourcePath ?? null,
  };
}

function toParams(query: EventQuery): Record<string, string> {
  const params: Record<string, string> = { max: String(query.max) };
  if (query.type !== undefined) {
    params.type = query.type;
  }
  if (query.user !== undefined) {
    params.user = query.user;
  }
  return params;
}

export class KeycloakEventLog implements EventLog {
  constructor(private readonly client: KeycloakAdminClient) {}

  async loginEvents(query: EventQuery): Promise<LoginEvent[]> {
    const raw = await this.client.getJson<KeycloakLoginEvent[]>(
      "/events",
      toParams(query),
    );
    return raw.map(toLoginEvent);
  }

  async adminEvents(query: EventQuery): Promise<AdminEvent[]> {
    const raw = await this.client.getJson<KeycloakAdminEvent[]>(
      "/admin-events",
      {
        max: String(query.max),
      },
    );
    return raw.map(toAdminEvent);
  }
}
