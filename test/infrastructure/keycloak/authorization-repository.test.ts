import { describe, expect, it } from "vitest";

import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakAuthorizationRepository } from "../../../src/infrastructure/keycloak/authorization-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakAuthorizationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakAuthorizationRepository(client), fetch };
}

describe("KeycloakAuthorizationRepository", () => {
  it("lists resources, mapping the _id field", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ _id: "r1", name: "res", type: "resource" }]),
    ]);
    const resources = await repo.resources(ClientUuid.fromString(UUID));
    expect(resources[0]?.id).toBe("r1");
    expect(fetch.requests[0]?.url).toContain(
      `/clients/${UUID}/authz/resource-server/resource`,
    );
  });

  it("lists policies", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ id: "p1", name: "pol", type: "role" }]),
    ]);
    const policies = await repo.policies(ClientUuid.fromString(UUID));
    expect(policies[0]?.name).toBe("pol");
    expect(fetch.requests[0]?.url).toContain(
      `/clients/${UUID}/authz/resource-server/policy`,
    );
  });

  it("lists permissions", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ id: "perm1", name: "perm", type: "resource" }]),
    ]);
    const permissions = await repo.permissions(ClientUuid.fromString(UUID));
    expect(permissions[0]?.name).toBe("perm");
    expect(fetch.requests[0]?.url).toContain(
      `/clients/${UUID}/authz/resource-server/permission`,
    );
  });
});
