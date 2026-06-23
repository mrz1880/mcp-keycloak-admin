import { describe, expect, it } from "vitest";

import { loadConfig } from "../../src/config/config.js";

const serviceAccountEnv = {
  KEYCLOAK_BASE_URL: "http://localhost:8080",
  KEYCLOAK_REALM: "Pandi-Panda",
  AUTH_MODE: "service_account",
  KC_CLIENT_ID: "mcp-admin",
  KC_CLIENT_SECRET: "secret",
};

describe("loadConfig", () => {
  it("loads a valid service-account configuration", () => {
    const config = loadConfig(serviceAccountEnv);
    expect(config.realm).toBe("Pandi-Panda");
    expect(config.readOnly).toBe(false);
    expect(config.allowedRealms).toEqual([]);
    expect(config.auth).toEqual({
      mode: "service_account",
      clientId: "mcp-admin",
      clientSecret: "secret",
    });
  });

  it("fails fast naming a missing required variable", () => {
    const { KEYCLOAK_BASE_URL: _omitted, ...rest } = serviceAccountEnv;
    expect(() => loadConfig(rest)).toThrow(/KEYCLOAK_BASE_URL/);
  });

  it("requires admin credentials in password mode", () => {
    expect(() =>
      loadConfig({
        KEYCLOAK_BASE_URL: "http://localhost:8080",
        KEYCLOAK_REALM: "Pandi-Panda",
        AUTH_MODE: "password",
      }),
    ).toThrow(/KC_ADMIN/);
  });

  it("parses the realm allow-list and read-only flag", () => {
    const config = loadConfig({
      ...serviceAccountEnv,
      READ_ONLY: "true",
      ALLOWED_REALMS: "Pandi-Panda, master",
    });
    expect(config.readOnly).toBe(true);
    expect(config.allowedRealms).toEqual(["Pandi-Panda", "master"]);
  });
});
