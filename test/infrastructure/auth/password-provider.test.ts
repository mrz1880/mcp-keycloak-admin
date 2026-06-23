import { describe, expect, it } from "vitest";

import { createPasswordProvider } from "../../../src/infrastructure/auth/password-provider.js";
import { FakeClock } from "../../support/fake-clock.js";

describe("createPasswordProvider", () => {
  it("requests a token using the password grant on admin-cli", async () => {
    let captured: { url: string; body: string } | null = null;
    const fetchFn = (url: string, init?: RequestInit): Promise<Response> => {
      captured = { url, body: String(init?.body) };
      return Promise.resolve(
        new Response(JSON.stringify({ access_token: "tok", expires_in: 60 }), {
          status: 200,
        }),
      );
    };

    await createPasswordProvider(
      {
        baseUrl: "http://kc:8080",
        realm: "master",
        username: "admin",
        password: "admin",
      },
      fetchFn,
      new FakeClock(0),
    ).getToken();

    expect(captured!.url).toBe(
      "http://kc:8080/realms/master/protocol/openid-connect/token",
    );
    expect(captured!.body).toContain("grant_type=password");
    expect(captured!.body).toContain("client_id=admin-cli");
    expect(captured!.body).toContain("username=admin");
  });
});
