import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakAuthenticationRepository } from "../../../src/infrastructure/keycloak/authentication-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

function makeRepo(responses: Response[]): {
  repo: KeycloakAuthenticationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakAuthenticationRepository(client), fetch };
}

describe("KeycloakAuthenticationRepository", () => {
  it("lists flows", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: "1", alias: "browser", builtIn: true }]),
    ]);
    const flows = await repo.listFlows();
    expect(flows[0]?.alias).toBe("browser");
  });

  it("lists required actions", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { alias: "VERIFY_EMAIL", name: "Verify Email", enabled: true },
      ]),
    ]);
    const actions = await repo.listRequiredActions();
    expect(actions[0]?.alias).toBe("VERIFY_EMAIL");
  });

  it("toggles a required action via GET then PUT", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({
        alias: "VERIFY_EMAIL",
        name: "Verify Email",
        enabled: true,
      }),
      new Response(null, { status: 204 }),
    ]);
    await repo.setRequiredActionEnabled("VERIFY_EMAIL", false);
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"enabled":false');
  });
});
