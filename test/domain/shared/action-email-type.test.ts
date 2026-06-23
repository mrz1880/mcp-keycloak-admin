import { describe, expect, it } from "vitest";

import { ActionEmailType } from "../../../src/domain/shared/action-email-type.js";

describe("ActionEmailType", () => {
  it("accepts a known action", () => {
    expect(ActionEmailType.fromString("VERIFY_EMAIL").toString()).toBe(
      "VERIFY_EMAIL",
    );
  });

  it("rejects an unknown action", () => {
    expect(() => ActionEmailType.fromString("DROP_TABLE")).toThrow(/Unknown/);
  });
});
