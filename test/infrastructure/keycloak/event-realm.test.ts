import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakEventLog } from "../../../src/infrastructure/keycloak/event-log.js";
import { KeycloakRealmInfo } from "../../../src/infrastructure/keycloak/realm-info.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "Pandi-Panda" };

function setup(responses: Response[]): {
  client: KeycloakAdminClient;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  return {
    client: new KeycloakAdminClient(
      config,
      new StubTokenProvider(),
      fetch.fetchFn,
    ),
    fetch,
  };
}

describe("KeycloakEventLog", () => {
  it("queries login events with filters and maps them", async () => {
    const { client, fetch } = setup([
      jsonResponse([{ time: 1, type: "LOGIN", userId: "u" }]),
    ]);
    const events = await new KeycloakEventLog(client).loginEvents({
      max: 5,
      type: "LOGIN",
    });
    expect(events[0]?.type).toBe("LOGIN");
    expect(fetch.requests[0]?.url).toContain("/events?");
    expect(fetch.requests[0]?.url).toContain("type=LOGIN");
  });

  it("queries admin events", async () => {
    const { client, fetch } = setup([
      jsonResponse([
        { time: 1, operationType: "CREATE", resourceType: "USER" },
      ]),
    ]);
    const events = await new KeycloakEventLog(client).adminEvents({ max: 5 });
    expect(events[0]?.operationType).toBe("CREATE");
    expect(fetch.requests[0]?.url).toContain("/admin-events");
  });
});

describe("KeycloakRealmInfo", () => {
  it("reads the realm config from the realm root", async () => {
    const { client, fetch } = setup([jsonResponse({ realm: "Pandi-Panda" })]);
    const realmConfig = await new KeycloakRealmInfo(client).getRealmConfig();
    expect(realmConfig.realm).toBe("Pandi-Panda");
    expect(fetch.requests[0]?.url).toBe(
      "http://kc:8080/admin/realms/Pandi-Panda",
    );
  });

  it("reads server info from the non-realm admin path", async () => {
    const { client, fetch } = setup([
      jsonResponse({ systemInfo: { version: "26.0.5" } }),
    ]);
    const info = await new KeycloakRealmInfo(client).serverInfo();
    expect(info.systemInfo).toBeDefined();
    expect(fetch.requests[0]?.url).toBe("http://kc:8080/admin/serverinfo");
  });
});
