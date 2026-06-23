import { describe, expect, it } from "vitest";

import { ComponentId } from "../../../src/domain/shared/component-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakFederationRepository } from "../../../src/infrastructure/keycloak/federation-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const ID = "fed00000-1234-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakFederationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakFederationRepository(client), fetch };
}

describe("KeycloakFederationRepository", () => {
  it("lists providers filtered by the storage provider type", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ id: ID, name: "corp", providerId: "ldap" }]),
    ]);
    const providers = await repo.list();
    expect(providers[0]?.name).toBe("corp");
    expect(fetch.requests[0]?.url).toContain(
      "type=org.keycloak.storage.UserStorageProvider",
    );
  });

  it("returns null for an unknown id", async () => {
    const { repo } = makeRepo([jsonResponse({ errorMessage: "x" }, 404)]);
    expect(await repo.find(ComponentId.fromString(ID))).toBeNull();
  });

  it("triggers a full sync and maps the result", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({ status: "3 imported", added: 3, updated: 0, removed: 0 }),
    ]);
    const result = await repo.sync(ComponentId.fromString(ID), "full");
    expect(result.added).toBe(3);
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      `/user-storage/${ID}/sync?action=triggerFullSync`,
    );
  });
});
