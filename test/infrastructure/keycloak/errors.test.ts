import { describe, expect, it } from "vitest";

import {
  KeycloakError,
  toReadableKeycloakError,
} from "../../../src/infrastructure/keycloak/errors.js";

describe("toReadableKeycloakError", () => {
  it("maps 404 to a not-found error", () => {
    const error = toReadableKeycloakError(404, {});
    expect(error).toBeInstanceOf(KeycloakError);
    expect(error.status).toBe(404);
    expect(error.message).toMatch(/not found/i);
  });

  it("surfaces the conflict reason on 409", () => {
    const error = toReadableKeycloakError(409, {
      errorMessage: "User exists with same email",
    });
    expect(error.status).toBe(409);
    expect(error.message).toContain("User exists with same email");
  });

  it("maps 403 to a permission error", () => {
    expect(toReadableKeycloakError(403, {}).message).toMatch(/permission/i);
  });

  it("handles a non-object body safely", () => {
    const error = toReadableKeycloakError(500, "boom");
    expect(error.status).toBe(500);
    expect(error.message).toMatch(/failed/i);
  });
});
