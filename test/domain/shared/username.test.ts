import { describe, expect, it } from "vitest";

import { Username } from "../../../src/domain/shared/username.js";

describe("Username", () => {
  it("exposes the value it was created from", () => {
    expect(Username.fromString("jdupont").toString()).toBe("jdupont");
  });

  it("rejects a blank username", () => {
    expect(() => Username.fromString("  ")).toThrow(/Username/);
  });

  it("rejects a username containing whitespace", () => {
    expect(() => Username.fromString("jean dupont")).toThrow(/whitespace/);
  });

  it("is equal by value", () => {
    expect(
      Username.fromString("jdupont").equals(Username.fromString("jdupont")),
    ).toBe(true);
  });
});
