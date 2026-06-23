import { describe, expect, it } from "vitest";

import { createClientCredentialsProvider } from "../../../src/infrastructure/auth/client-credentials-provider.js";
import { FakeClock } from "../../support/fake-clock.js";

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

const config = {
  baseUrl: "http://kc:8080",
  realm: "Pandi-Panda",
  clientId: "mcp-admin",
  clientSecret: "s3cr3t",
};

describe("createClientCredentialsProvider", () => {
  it("requests a token using the client_credentials grant", async () => {
    let captured: { url: string; body: string } | null = null;
    const fetchFn = (url: string, init?: RequestInit): Promise<Response> => {
      captured = { url, body: String(init?.body) };
      return Promise.resolve(
        jsonResponse({ access_token: "tok", expires_in: 300 }),
      );
    };

    const token = await createClientCredentialsProvider(
      config,
      fetchFn,
      new FakeClock(0),
    ).getToken();

    expect(token.toString()).toBe("tok");
    expect(captured!.url).toBe(
      "http://kc:8080/realms/Pandi-Panda/protocol/openid-connect/token",
    );
    expect(captured!.body).toContain("grant_type=client_credentials");
    expect(captured!.body).toContain("client_id=mcp-admin");
  });

  it("raises a readable error when authentication fails", async () => {
    const fetchFn = (): Promise<Response> =>
      Promise.resolve(new Response("nope", { status: 401 }));

    await expect(
      createClientCredentialsProvider(
        config,
        fetchFn,
        new FakeClock(0),
      ).getToken(),
    ).rejects.toThrow(/Authentication against Keycloak failed/);
  });
});
