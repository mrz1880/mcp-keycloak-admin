import { describe, expect, it } from "vitest";

import { Email } from "../../../src/domain/shared/email.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakUserRepository } from "../../../src/infrastructure/keycloak/user-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "Pandi-Panda" };
const ID = "93d199e4-17b7-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakUserRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakUserRepository(client), fetch };
}

describe("KeycloakUserRepository", () => {
  it("searches by email and maps the response to domain users", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([
        {
          id: ID,
          username: "jdupont",
          email: "jean@example.com",
          enabled: true,
        },
      ]),
    ]);

    const result = await repo.search({
      email: Email.fromString("jean@example.com"),
      first: 0,
      max: 20,
    });

    expect(result[0]?.username.toString()).toBe("jdupont");
    expect(result[0]?.email?.toString()).toBe("jean@example.com");
    expect(fetch.requests[0]?.url).toContain("email=jean%40example.com");
  });

  it("returns null when the user does not exist", async () => {
    const { repo } = makeRepo([jsonResponse({ errorMessage: "missing" }, 404)]);

    const result = await repo.findById(UserId.fromString(ID));

    expect(result).toBeNull();
  });

  it("counts active sessions", async () => {
    const { repo } = makeRepo([jsonResponse([{}, {}, {}])]);

    expect(await repo.countActiveSessions(UserId.fromString(ID))).toBe(3);
  });
});
