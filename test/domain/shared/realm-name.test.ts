import { describe, expect, it } from "vitest";

import { RealmName } from "../../../src/domain/shared/realm-name.js";

describe("RealmName", () => {
  it("exposes the realm it was created from", () => {
    expect(RealmName.fromString("demo-realm").toString()).toBe("demo-realm");
  });

  it("trims surrounding whitespace", () => {
    expect(RealmName.fromString("  demo-realm  ").toString()).toBe(
      "demo-realm",
    );
  });

  it("rejects an empty or blank realm", () => {
    expect(() => RealmName.fromString("   ")).toThrow(/realm/i);
  });

  it("is equal to another realm with the same value", () => {
    expect(
      RealmName.fromString("demo-realm").equals(
        RealmName.fromString("demo-realm"),
      ),
    ).toBe(true);
  });

  it("differs from a realm with another value", () => {
    expect(
      RealmName.fromString("demo-realm").equals(RealmName.fromString("master")),
    ).toBe(false);
  });
});
