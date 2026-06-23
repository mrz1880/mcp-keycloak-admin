import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { ToolLevel } from "../../../src/domain/policy/tool-level.js";

describe("ToolAccessPolicy", () => {
  it("blocks destructive tools in read-only mode", () => {
    expect(ToolAccessPolicy.of(true).isBlocked(ToolLevel.Destructive)).toBe(
      true,
    );
  });

  it("blocks write tools in read-only mode", () => {
    expect(ToolAccessPolicy.of(true).isBlocked(ToolLevel.Write)).toBe(true);
  });

  it("allows read tools in read-only mode", () => {
    expect(ToolAccessPolicy.of(true).isBlocked(ToolLevel.Read)).toBe(false);
  });

  it("allows everything when not read-only", () => {
    const policy = ToolAccessPolicy.of(false);
    expect(policy.isBlocked(ToolLevel.Destructive)).toBe(false);
    expect(policy.isBlocked(ToolLevel.Write)).toBe(false);
  });
});
