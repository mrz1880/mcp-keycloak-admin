import { describe, expect, it } from "vitest";

import { DestructiveOperation } from "../../../../src/domain/policy/destructive-operation.js";
import { ElicitationConfirmer } from "../../../../src/infrastructure/mcp/confirmation/elicitation-confirmer.js";

const operation = DestructiveOperation.of(
  "Delete user jdupont",
  "Irreversible.",
);

describe("ElicitationConfirmer", () => {
  it("approves when the user accepts and ticks confirm", async () => {
    const confirmer = new ElicitationConfirmer(() =>
      Promise.resolve({ action: "accept", content: { confirm: true } }),
    );
    expect(await confirmer.confirm(operation)).toBe(true);
  });

  it("rejects when the user declines", async () => {
    const confirmer = new ElicitationConfirmer(() =>
      Promise.resolve({ action: "decline" }),
    );
    expect(await confirmer.confirm(operation)).toBe(false);
  });

  it("rejects when accepted without ticking confirm", async () => {
    const confirmer = new ElicitationConfirmer(() =>
      Promise.resolve({ action: "accept", content: { confirm: false } }),
    );
    expect(await confirmer.confirm(operation)).toBe(false);
  });

  it("sends the operation impact as the elicitation message", async () => {
    let message = "";
    const confirmer = new ElicitationConfirmer((request) => {
      message = request.message;
      return Promise.resolve({ action: "cancel" });
    });

    await confirmer.confirm(operation);

    expect(message).toContain("Delete user jdupont");
  });
});
