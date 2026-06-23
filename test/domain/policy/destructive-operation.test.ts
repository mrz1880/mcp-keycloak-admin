import { describe, expect, it } from "vitest";

import { DestructiveOperation } from "../../../src/domain/policy/destructive-operation.js";

describe("DestructiveOperation", () => {
  it("describes the summary and the impact", () => {
    const op = DestructiveOperation.of(
      "Delete user jdupont",
      "Revokes 3 sessions. Irreversible.",
    );
    const description = op.describe();
    expect(description).toContain("Delete user jdupont");
    expect(description).toContain("Irreversible");
  });

  it("requires a non-empty impact", () => {
    expect(() => DestructiveOperation.of("summary", "")).toThrow(/impact/);
  });
});
