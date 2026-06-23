import { describe, expect, it } from "vitest";

import { ClientScopeId } from "../../../src/domain/shared/client-scope-id.js";
import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakClientScopeRepository } from "../../../src/infrastructure/keycloak/client-scope-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const SCOPE = "5c0fe000-1234-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakClientScopeRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakClientScopeRepository(client), fetch };
}

describe("KeycloakClientScopeRepository", () => {
  it("lists scopes", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { id: SCOPE, name: "profile", protocol: "openid-connect" },
      ]),
    ]);
    const scopes = await repo.listScopes();
    expect(scopes[0]?.name.toString()).toBe("profile");
  });

  it("assigns a default scope with a PUT", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.assignDefaultScope(
      ClientUuid.fromString(UUID),
      ClientScopeId.fromString(SCOPE),
    );
    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.url).toContain(
      `/clients/${UUID}/default-client-scopes/${SCOPE}`,
    );
  });

  it("removes a default scope with a DELETE", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.removeDefaultScope(
      ClientUuid.fromString(UUID),
      ClientScopeId.fromString(SCOPE),
    );
    expect(fetch.requests[0]?.method).toBe("DELETE");
  });

  it("lists protocol mappers", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { id: "m1", name: "email", protocolMapper: "oidc-usermodel" },
      ]),
    ]);
    const mappers = await repo.listMappers(ClientUuid.fromString(UUID));
    expect(mappers[0]?.type).toBe("oidc-usermodel");
  });
});
