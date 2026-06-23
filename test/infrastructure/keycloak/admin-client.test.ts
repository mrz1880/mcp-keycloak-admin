import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakError } from "../../../src/infrastructure/keycloak/errors.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

describe("KeycloakAdminClient", () => {
  it("injects the bearer token and targets the realm admin path", async () => {
    const fetch = new FakeFetch([jsonResponse([{ id: "1" }])]);
    const client = new KeycloakAdminClient(
      config,
      new StubTokenProvider(["tok"]),
      fetch.fetchFn,
    );

    const result = await client.getJson<{ id: string }[]>("/users");

    expect(result).toEqual([{ id: "1" }]);
    expect(fetch.requests[0]?.url).toBe(
      "http://kc:8080/admin/realms/demo-realm/users",
    );
    expect(fetch.requests[0]?.authorization).toBe("Bearer tok");
  });

  it("retries once after a 401 using a refreshed token", async () => {
    const fetch = new FakeFetch([
      new Response("", { status: 401 }),
      jsonResponse({ ok: true }),
    ]);
    const client = new KeycloakAdminClient(
      config,
      new StubTokenProvider(["expired", "fresh"]),
      fetch.fetchFn,
    );

    const result = await client.getJson<{ ok: boolean }>("/users/1");

    expect(result).toEqual({ ok: true });
    expect(fetch.requests).toHaveLength(2);
    expect(fetch.requests[1]?.authorization).toBe("Bearer fresh");
  });

  it("maps error responses to a KeycloakError", async () => {
    const fetch = new FakeFetch([jsonResponse({ errorMessage: "nope" }, 404)]);
    const client = new KeycloakAdminClient(
      config,
      new StubTokenProvider(),
      fetch.fetchFn,
    );

    await expect(client.getJson("/users/1")).rejects.toBeInstanceOf(
      KeycloakError,
    );
  });

  it("paginates list endpoints until a short page is returned", async () => {
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      id: String(index),
    }));
    const fetch = new FakeFetch([
      jsonResponse(fullPage),
      jsonResponse([{ id: "100" }]),
    ]);
    const client = new KeycloakAdminClient(
      config,
      new StubTokenProvider(),
      fetch.fetchFn,
    );

    const all = await client.list<{ id: string }>("/users");

    expect(all).toHaveLength(101);
    expect(fetch.requests[0]?.url).toContain("first=0&max=100");
    expect(fetch.requests[1]?.url).toContain("first=100&max=100");
  });
});
