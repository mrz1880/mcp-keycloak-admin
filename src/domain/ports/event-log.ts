import type { AdminEvent, EventQuery, LoginEvent } from "../event/events.js";

export interface EventLog {
  loginEvents(query: EventQuery): Promise<LoginEvent[]>;
  adminEvents(query: EventQuery): Promise<AdminEvent[]>;
}
