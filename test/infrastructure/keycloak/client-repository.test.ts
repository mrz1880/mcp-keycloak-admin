import { describe, expect, it } from "vitest";

import { ClientId } from "../../../src/domain/shared/client-id.js";
import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakClientRepository } from "../../../src/infrastructure/keycloak/client-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
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

  it("paginates the full client list across pages", async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      id: `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      clientId: `c${String(index)}`,
    }));
    const { repo, fetch } = makeRepo([
      jsonResponse(fullPage),
      jsonResponse([{ id: UUID, clientId: "last" }]),
    ]);

    const clients = await repo.list();

    expect(clients).toHaveLength(101);
    expect(fetch.requests[0]?.url).toContain("first=0&max=100");
    expect(fetch.requests[1]?.url).toContain("first=100&max=100");
  });

  it("creates a client with a POST", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.create({
      clientId: ClientId.fromString("new-client"),
      enabled: true,
      publicClient: false,
      redirectUris: ["https://app/*"],
      webOrigins: [],
    });
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toBe(
      "http://kc:8080/admin/realms/demo-realm/clients",
    );
    expect(fetch.requests[0]?.body).toContain('"clientId":"new-client"');
  });

  it("creates a client including its web origins in the body", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.create({
      clientId: ClientId.fromString("new-client"),
      enabled: true,
      publicClient: false,
      redirectUris: ["https://app/*"],
      webOrigins: ["https://app.example.com"],
    });
    expect(fetch.requests[0]?.body).toContain(
      '"webOrigins":["https://app.example.com"]',
    );
  });

  it("updates a client with a PUT of only the changed fields", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.update(ClientUuid.fromString(UUID), { enabled: false });
    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.url).toContain(`/clients/${UUID}`);
    expect(fetch.requests[0]?.body).toBe('{"enabled":false}');
  });

  it("updates a client's web origins with a PUT", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.update(ClientUuid.fromString(UUID), {
      webOrigins: ["https://a.example.com"],
    });
    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.body).toBe(
      '{"webOrigins":["https://a.example.com"]}',
    );
  });

  it("deletes a client with a DELETE", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.delete(ClientUuid.fromString(UUID));
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(`/clients/${UUID}`);
  });
});
