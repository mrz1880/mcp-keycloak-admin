import { describe, expect, it } from "vitest";

import { ClientId } from "../../../src/domain/shared/client-id.js";
import { ClientUuid } from "../../../src/domain/shared/client-uuid.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";

describe("ClientId", () => {
  it("exposes the human-readable clientId", () => {
    expect(ClientId.fromString("mcp-admin").toString()).toBe("mcp-admin");
  });

  it("rejects a blank clientId", () => {
    expect(() => ClientId.fromString(" ")).toThrow(/ClientId/);
  });
});

describe("ClientUuid", () => {
  it("exposes a valid UUID", () => {
    expect(ClientUuid.fromString(UUID).toString()).toBe(UUID);
  });

  it("rejects a non-UUID value", () => {
    expect(() => ClientUuid.fromString("mcp-admin")).toThrow(/ClientUuid/);
  });
});
