import type { EventLog } from "../../domain/ports/event-log.js";
import type { EventQuery, LoginEvent } from "../../domain/event/events.js";

export class GetLoginEventsUseCase {
  constructor(private readonly events: EventLog) {}

  execute(query: EventQuery): Promise<LoginEvent[]> {
    return this.events.loginEvents(query);
  }
}
