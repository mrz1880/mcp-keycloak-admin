import { describe, expect, it } from "vitest";

import {
  ensureNonBlank,
  ensureUuid,
} from "../../../src/domain/shared/guards.js";

describe("ensureNonBlank", () => {
  it("returns the trimmed value", () => {
    expect(ensureNonBlank("  hello  ", "Field")).toBe("hello");
  });

  it("throws naming the field when blank", () => {
    expect(() => ensureNonBlank("   ", "Username")).toThrow(/Username/);
  });
});

describe("ensureUuid", () => {
  it("accepts a valid UUID", () => {
    const uuid = "93d199e4-17b7-4035-95a5-237a748eec03";
    expect(ensureUuid(uuid, "UserId")).toBe(uuid);
  });

  it("rejects a non-UUID naming the field", () => {
    expect(() => ensureUuid("not-a-uuid", "UserId")).toThrow(/UserId/);
  });
});
