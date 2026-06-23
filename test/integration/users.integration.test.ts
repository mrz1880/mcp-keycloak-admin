import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Username } from "../../src/domain/shared/username.js";
import { createPasswordProvider } from "../../src/infrastructure/auth/password-provider.js";
import { systemClock } from "../../src/infrastructure/auth/system-clock.js";
import type { FetchFn } from "../../src/infrastructure/auth/token-endpoint.js";
import { KeycloakAdminClient } from "../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakUserRepository } from "../../src/infrastructure/keycloak/user-repository.js";

const httpFetch: FetchFn = (url, init) => fetch(url, init);

let container: StartedTestContainer;
let baseUrl: string;

beforeAll(async () => {
  container = await new GenericContainer("quay.io/keycloak/keycloak:26.0.5")
    .withExposedPorts(8080)
    .withEnvironment({
      KEYCLOAK_ADMIN: "admin",
      KEYCLOAK_ADMIN_PASSWORD: "admin",
    })
    .withCommand(["start-dev"])
    .withWaitStrategy(Wait.forHttp("/realms/master", 8080).forStatusCode(200))
    .withStartupTimeout(120_000)
    .start();
  baseUrl = `http://${container.getHost()}:${String(container.getMappedPort(8080))}`;
}, 180_000);

afterAll(async () => {
  await container.stop();
});

function repository(): {
  client: KeycloakAdminClient;
  users: KeycloakUserRepository;
} {
  const tokens = createPasswordProvider(
    { baseUrl, realm: "master", username: "admin", password: "admin" },
    httpFetch,
    systemClock,
  );
  const client = new KeycloakAdminClient(
    { baseUrl, realm: "master" },
    tokens,
    httpFetch,
  );
  return { client, users: new KeycloakUserRepository(client) };
}

describe("Keycloak user round-trip", () => {
  it("creates, finds and deletes a user against a real Keycloak", async () => {
    const { client, users } = repository();
    const username = "itest-user";

    await client.post("/users", {
      username,
      email: "itest@example.com",
      enabled: true,
      emailVerified: true,
    });

    const found = await users.search({
      username: Username.fromString(username),
      first: 0,
      max: 20,
    });
    expect(found).toHaveLength(1);
    const user = found[0];
    expect(user?.email?.toString()).toBe("itest@example.com");

    const byId = await users.findById(user!.id);
    expect(byId?.username.toString()).toBe(username);

    await users.delete(user!.id);

    const afterDelete = await users.search({
      username: Username.fromString(username),
      first: 0,
      max: 20,
    });
    expect(afterDelete).toHaveLength(0);
  });
});
