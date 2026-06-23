import { describe, expect, it } from "vitest";

import { Email } from "../../../src/domain/shared/email.js";

describe("Email", () => {
  it("exposes a normalized lower-case address", () => {
    expect(Email.fromString("Jean.Dupont@Example.COM").toString()).toBe(
      "jean.dupont@example.com",
    );
  });

  it("rejects an address without a domain", () => {
    expect(() => Email.fromString("jean@")).toThrow(/Invalid email/);
  });

  it("rejects an address without an @", () => {
    expect(() => Email.fromString("jean.example.com")).toThrow(/Invalid email/);
  });

  it("is equal regardless of case", () => {
    expect(
      Email.fromString("a@b.com").equals(Email.fromString("A@B.com")),
    ).toBe(true);
  });
});
