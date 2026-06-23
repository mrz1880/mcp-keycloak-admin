import { describe, expect, it } from "vitest";

import { IdpAlias } from "../../../src/domain/shared/idp-alias.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakIdentityProviderRepository } from "../../../src/infrastructure/keycloak/identity-provider-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

function makeRepo(responses: Response[]): {
  repo: KeycloakIdentityProviderRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakIdentityProviderRepository(client), fetch };
}

describe("KeycloakIdentityProviderRepository", () => {
  it("lists identity providers", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ alias: "google", providerId: "oidc", enabled: true }]),
    ]);
    const idps = await repo.list();
    expect(idps[0]?.alias.toString()).toBe("google");
  });

  it("returns null for an unknown alias", async () => {
    const { repo } = makeRepo([jsonResponse({ errorMessage: "x" }, 404)]);
    expect(await repo.find(IdpAlias.fromString("ghost"))).toBeNull();
  });

  it("creates an identity provider with a POST", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.create({
      alias: IdpAlias.fromString("google"),
      providerId: "oidc",
      enabled: true,
      config: { clientId: "x" },
    });
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain("/identity-provider/instances");
    expect(fetch.requests[0]?.body).toContain('"alias":"google"');
  });

  it("deletes an identity provider with a DELETE", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.delete(IdpAlias.fromString("google"));
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(
      "/identity-provider/instances/google",
    );
  });

  it("lists mappers", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { id: "m1", name: "email", identityProviderMapper: "oidc-attr" },
      ]),
    ]);
    const mappers = await repo.listMappers(IdpAlias.fromString("google"));
    expect(mappers[0]?.type).toBe("oidc-attr");
  });
});
