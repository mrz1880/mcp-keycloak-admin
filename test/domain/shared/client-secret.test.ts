import { describe, expect, it } from "vitest";

import { ClientSecret } from "../../../src/domain/shared/client-secret.js";

describe("ClientSecret", () => {
  it("reveals the raw secret only when explicitly asked", () => {
    expect(ClientSecret.fromString("s3cr3t").reveal()).toBe("s3cr3t");
  });

  it("masks the secret by default via toString", () => {
    expect(ClientSecret.fromString("s3cr3t").toString()).not.toContain(
      "s3cr3t",
    );
  });

  it("rejects an empty secret", () => {
    expect(() => ClientSecret.fromString("")).toThrow(/ClientSecret/);
  });
});
