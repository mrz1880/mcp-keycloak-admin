import { describe, expect, it } from "vitest";

import { Password } from "../../../src/domain/shared/password.js";

describe("Password", () => {
  it("reveals the raw value only when explicitly asked", () => {
    expect(Password.fromString("hunter2").reveal()).toBe("hunter2");
  });

  it("never leaks through serialization", () => {
    expect(JSON.stringify({ p: Password.fromString("hunter2") })).not.toContain(
      "hunter2",
    );
  });

  it("rejects an empty password", () => {
    expect(() => Password.fromString("")).toThrow(/Password/);
  });
});
