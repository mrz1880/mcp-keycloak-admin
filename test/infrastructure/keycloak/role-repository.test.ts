import { describe, expect, it } from "vitest";

import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";
import { RoleName } from "../../../src/domain/shared/role-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakRoleRepository } from "../../../src/infrastructure/keycloak/role-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { aRole } from "../../support/roles.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const ID = "93d199e4-17b7-4035-95a5-237a748eec03";
const CLIENT = "c0ffee00-1234-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakRoleRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakRoleRepository(client), fetch };
}

describe("KeycloakRoleRepository", () => {
  it("lists realm roles", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: "1", name: "admin", description: "d" }]),
    ]);
    const roles = await repo.listRealmRoles();
    expect(roles[0]?.name.toString()).toBe("admin");
  });

  it("returns null for an unknown role", async () => {
    const { repo } = makeRepo([jsonResponse({ errorMessage: "x" }, 404)]);
    expect(await repo.findRealmRole(RoleName.fromString("ghost"))).toBeNull();
  });

  it("assigns a role with a POST of the representation", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.assignRealmRole(UserId.fromString(ID), aRole("admin", "role-1"));
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      `/users/${ID}/role-mappings/realm`,
    );
    expect(fetch.requests[0]?.body).toContain('"name":"admin"');
  });

  it("removes a role with a DELETE carrying the representation", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.removeRealmRole(UserId.fromString(ID), aRole("admin", "role-1"));
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.body).toContain('"id":"role-1"');
  });

  it("lists a client's roles", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ id: "cr1", name: "uma_protection" }]),
    ]);
    const roles = await repo.listClientRoles(ClientUuid.fromString(CLIENT));
    expect(roles[0]?.name.toString()).toBe("uma_protection");
    expect(fetch.requests[0]?.url).toContain(`/clients/${CLIENT}/roles`);
  });

  it("assigns a client role with a POST to the client role-mapping", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.assignClientRole(
      UserId.fromString(ID),
      ClientUuid.fromString(CLIENT),
      aRole("uma_protection", "cr1"),
    );
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      `/users/${ID}/role-mappings/clients/${CLIENT}`,
    );
  });

  it("removes a client role with a DELETE", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.removeClientRole(
      UserId.fromString(ID),
      ClientUuid.fromString(CLIENT),
      aRole("uma_protection", "cr1"),
    );
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(
      `/users/${ID}/role-mappings/clients/${CLIENT}`,
    );
  });
});
