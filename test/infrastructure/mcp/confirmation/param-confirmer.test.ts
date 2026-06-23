import { describe, expect, it } from "vitest";

import { ParamConfirmer } from "../../../../src/infrastructure/mcp/confirmation/param-confirmer.js";

describe("ParamConfirmer", () => {
  it("approves only when confirm was explicitly provided", async () => {
    expect(await new ParamConfirmer(true).confirm()).toBe(true);
    expect(await new ParamConfirmer(false).confirm()).toBe(false);
  });
});
