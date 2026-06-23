import { describe, expect, it } from "vitest";

import { GetAdminEventsUseCase } from "../../../src/application/events/get-admin-events.use-case.js";
import { GetLoginEventsUseCase } from "../../../src/application/events/get-login-events.use-case.js";
import { GetRealmConfigUseCase } from "../../../src/application/realm/get-realm-config.use-case.js";
import { GetServerInfoUseCase } from "../../../src/application/realm/get-server-info.use-case.js";
import type { EventLog } from "../../../src/domain/ports/event-log.js";
import type { RealmInfo } from "../../../src/domain/ports/realm-info.js";

const eventLog: EventLog = {
  loginEvents: () =>
    Promise.resolve([
      { time: 1, type: "LOGIN", userId: "u", ipAddress: "1.2.3.4" },
    ]),
  adminEvents: () =>
    Promise.resolve([
      {
        time: 2,
        operationType: "CREATE",
        resourceType: "USER",
        resourcePath: "users/1",
      },
    ]),
};

const realmInfo: RealmInfo = {
  getRealmConfig: () =>
    Promise.resolve({ realm: "Pandi-Panda", enabled: true }),
  serverInfo: () => Promise.resolve({ systemInfo: { version: "26.0.5" } }),
};

describe("event & realm use cases", () => {
  it("returns login events", async () => {
    const events = await new GetLoginEventsUseCase(eventLog).execute({
      max: 10,
    });
    expect(events[0]?.type).toBe("LOGIN");
  });

  it("returns admin events", async () => {
    const events = await new GetAdminEventsUseCase(eventLog).execute({
      max: 10,
    });
    expect(events[0]?.operationType).toBe("CREATE");
  });

  it("returns the realm config", async () => {
    const config = await new GetRealmConfigUseCase(realmInfo).execute();
    expect(config.realm).toBe("Pandi-Panda");
  });

  it("returns server info", async () => {
    const info = await new GetServerInfoUseCase(realmInfo).execute();
    expect(info.systemInfo).toBeDefined();
  });
});
