import {
  GenericContainer,
  type StartedTestContainer,
  Wait,
} from "testcontainers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { ClientId } from "../../src/domain/shared/client-id.js";
import { GroupName } from "../../src/domain/shared/group-name.js";
import { RoleName } from "../../src/domain/shared/role-name.js";
import { Username } from "../../src/domain/shared/username.js";
import { createPasswordProvider } from "../../src/infrastructure/auth/password-provider.js";
import { systemClock } from "../../src/infrastructure/auth/system-clock.js";
import type { FetchFn } from "../../src/infrastructure/auth/token-endpoint.js";
import { KeycloakAdminClient } from "../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakClientRepository } from "../../src/infrastructure/keycloak/client-repository.js";
import { KeycloakGroupRepository } from "../../src/infrastructure/keycloak/group-repository.js";
import { KeycloakRoleRepository } from "../../src/infrastructure/keycloak/role-repository.js";
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

function adminClient(): KeycloakAdminClient {
  const tokens = createPasswordProvider(
    { baseUrl, realm: "master", username: "admin", password: "admin" },
    httpFetch,
    systemClock,
  );
  return new KeycloakAdminClient(
    { baseUrl, realm: "master" },
    tokens,
    httpFetch,
  );
}

describe("Keycloak integration round-trips", () => {
  it("creates, finds and deletes a user", async () => {
    const client = adminClient();
    const users = new KeycloakUserRepository(client);
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

    await users.delete(user!.id);

    expect(
      await users.search({
        username: Username.fromString(username),
        first: 0,
        max: 20,
      }),
    ).toHaveLength(0);
  });

  it("creates, lists and deletes a group", async () => {
    const groups = new KeycloakGroupRepository(adminClient());

    await groups.create(GroupName.fromString("itest-group"));

    const found = (await groups.list()).find(
      (g) => g.name.toString() === "itest-group",
    );
    expect(found).toBeDefined();

    await groups.delete(found!.id);

    expect(
      (await groups.list()).some((g) => g.name.toString() === "itest-group"),
    ).toBe(false);
  });

  it("assigns and removes a realm role on a user", async () => {
    const client = adminClient();
    const users = new KeycloakUserRepository(client);
    const roles = new KeycloakRoleRepository(client);

    await client.post("/roles", { name: "itest-role" });
    await client.post("/users", { username: "itest-roleuser", enabled: true });
    const user = (
      await users.search({
        username: Username.fromString("itest-roleuser"),
        first: 0,
        max: 20,
      })
    )[0];
    const role = await roles.findRealmRole(RoleName.fromString("itest-role"));
    expect(role).not.toBeNull();

    await roles.assignRealmRole(user!.id, role!);
    expect(
      (await roles.listUserRealmRoles(user!.id)).some(
        (r) => r.name.toString() === "itest-role",
      ),
    ).toBe(true);

    await roles.removeRealmRole(user!.id, role!);
    expect(
      (await roles.listUserRealmRoles(user!.id)).some(
        (r) => r.name.toString() === "itest-role",
      ),
    ).toBe(false);

    await users.delete(user!.id);
    await client.delete("/roles/itest-role");
  });

  it("reads and regenerates a confidential client's secret", async () => {
    const client = adminClient();
    const clients = new KeycloakClientRepository(client);

    await client.post("/clients", {
      clientId: "itest-client",
      enabled: true,
      publicClient: false,
      secret: "initial-secret",
    });

    const summary = await clients.findByClientId(
      ClientId.fromString("itest-client"),
    );
    expect(summary).not.toBeNull();

    const before = await clients.getSecret(summary!.uuid);
    const after = await clients.regenerateSecret(summary!.uuid);
    expect(after.reveal()).not.toBe(before.reveal());

    await client.delete(`/clients/${summary!.uuid.toString()}`);
  });
});
