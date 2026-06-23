import { describe, expect, it } from "vitest";

import { UserId } from "../../../src/domain/shared/user-id.js";

const VALID = "93d199e4-17b7-4035-95a5-237a748eec03";

describe("UserId", () => {
  it("exposes a valid UUID", () => {
    expect(UserId.fromString(VALID).toString()).toBe(VALID);
  });

  it("rejects a value that is not a UUID", () => {
    expect(() => UserId.fromString("42")).toThrow(/UserId/);
  });

  it("is equal by value", () => {
    expect(UserId.fromString(VALID).equals(UserId.fromString(VALID))).toBe(
      true,
    );
  });
});
