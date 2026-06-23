import { describe, expect, it } from "vitest";

import { RealmName } from "../../../src/domain/shared/realm-name.js";

describe("RealmName", () => {
  it("exposes the realm it was created from", () => {
    expect(RealmName.fromString("Pandi-Panda").toString()).toBe("Pandi-Panda");
  });

  it("trims surrounding whitespace", () => {
    expect(RealmName.fromString("  Pandi-Panda  ").toString()).toBe(
      "Pandi-Panda",
    );
  });

  it("rejects an empty or blank realm", () => {
    expect(() => RealmName.fromString("   ")).toThrow(/realm/i);
  });

  it("is equal to another realm with the same value", () => {
    expect(
      RealmName.fromString("Pandi-Panda").equals(
        RealmName.fromString("Pandi-Panda"),
      ),
    ).toBe(true);
  });

  it("differs from a realm with another value", () => {
    expect(
      RealmName.fromString("Pandi-Panda").equals(
        RealmName.fromString("master"),
      ),
    ).toBe(false);
  });
});
