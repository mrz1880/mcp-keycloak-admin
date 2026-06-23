import { describe, expect, it } from "vitest";

import { Email } from "../../../src/domain/shared/email.js";
import { Password } from "../../../src/domain/shared/password.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { Username } from "../../../src/domain/shared/username.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakUserRepository } from "../../../src/infrastructure/keycloak/user-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
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

  it("creates a user with a POST to /users", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);

    await repo.create({
      username: Username.fromString("newbie"),
      email: Email.fromString("n@e.com"),
      enabled: true,
      emailVerified: true,
    });

    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toBe(
      "http://kc:8080/admin/realms/demo-realm/users",
    );
    expect(fetch.requests[0]?.body).toContain('"username":"newbie"');
  });

  it("resets a password with a PUT", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);

    await repo.resetPassword(
      UserId.fromString(ID),
      Password.fromString("p"),
      true,
    );

    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.url).toContain(`/users/${ID}/reset-password`);
    expect(fetch.requests[0]?.body).toContain('"temporary":true');
  });

  it("logs a user out with a POST", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);

    await repo.logout(UserId.fromString(ID));

    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(`/users/${ID}/logout`);
  });

  it("updates a user with a PUT of only the changed fields", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);

    await repo.update(UserId.fromString(ID), {
      email: Email.fromString("new@e.com"),
      enabled: false,
    });

    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.url).toContain(`/users/${ID}`);
    expect(fetch.requests[0]?.body).toContain('"email":"new@e.com"');
    expect(fetch.requests[0]?.body).toContain('"enabled":false');
  });

  it("lists sessions and maps them", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { id: "s1", ipAddress: "1.2.3.4", start: 1, lastAccess: 2 },
      ]),
    ]);

    const sessions = await repo.listSessions(UserId.fromString(ID));

    expect(sessions[0]?.id).toBe("s1");
    expect(sessions[0]?.ipAddress).toBe("1.2.3.4");
  });
});
