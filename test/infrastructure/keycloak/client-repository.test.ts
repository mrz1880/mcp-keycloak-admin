import { describe, expect, it } from "vitest";

import { ClientId } from "../../../src/domain/shared/client-id.js";
import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakClientRepository } from "../../../src/infrastructure/keycloak/client-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "Pandi-Panda" };
const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakClientRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakClientRepository(client), fetch };
}

describe("KeycloakClientRepository", () => {
  it("finds a client by clientId via query", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([{ id: UUID, clientId: "mcp-admin", enabled: true }]),
    ]);
    const client = await repo.findByClientId(ClientId.fromString("mcp-admin"));
    expect(client?.uuid.toString()).toBe(UUID);
    expect(fetch.requests[0]?.url).toContain("clientId=mcp-admin");
  });

  it("reads the client secret", async () => {
    const { repo } = makeRepo([jsonResponse({ value: "s3cr3t" })]);
    const secret = await repo.getSecret(ClientUuid.fromString(UUID));
    expect(secret.reveal()).toBe("s3cr3t");
  });

  it("regenerates the secret with a POST and returns the new value", async () => {
    const { repo, fetch } = makeRepo([jsonResponse({ value: "fresh" })]);
    const secret = await repo.regenerateSecret(ClientUuid.fromString(UUID));
    expect(secret.reveal()).toBe("fresh");
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(`/clients/${UUID}/client-secret`);
  });
});
