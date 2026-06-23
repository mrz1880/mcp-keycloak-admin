import { describe, expect, it } from "vitest";

import { RoleName } from "../../../src/domain/shared/role-name.js";

describe("RoleName", () => {
  it("exposes the value it was created from", () => {
    expect(RoleName.fromString("manage-users").toString()).toBe("manage-users");
  });

  it("rejects a blank role name", () => {
    expect(() => RoleName.fromString("  ")).toThrow(/RoleName/);
  });

  it("is equal by value", () => {
    expect(
      RoleName.fromString("admin").equals(RoleName.fromString("admin")),
    ).toBe(true);
  });
});
