import { describe, expect, it } from "vitest";

import { RoleName } from "../../../src/domain/shared/role-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakRoleRepository } from "../../../src/infrastructure/keycloak/role-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { aRole } from "../../support/roles.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "Pandi-Panda" };
const ID = "93d199e4-17b7-4035-95a5-237a748eec03";

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
});
