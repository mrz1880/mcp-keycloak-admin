import type { EventLog } from "../../domain/ports/event-log.js";
import type { AdminEvent, EventQuery } from "../../domain/event/events.js";

export class GetAdminEventsUseCase {
  constructor(private readonly events: EventLog) {}

  execute(query: EventQuery): Promise<AdminEvent[]> {
    return this.events.adminEvents(query);
  }
}
