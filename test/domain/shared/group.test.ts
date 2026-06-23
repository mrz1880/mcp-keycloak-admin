import { describe, expect, it } from "vitest";

import { GroupId } from "../../../src/domain/shared/group-id.js";
import { GroupName } from "../../../src/domain/shared/group-name.js";

describe("GroupId", () => {
  it("accepts a UUID", () => {
    const uuid = "93d199e4-17b7-4035-95a5-237a748eec03";
    expect(GroupId.fromString(uuid).toString()).toBe(uuid);
  });

  it("rejects a non-UUID", () => {
    expect(() => GroupId.fromString("nope")).toThrow(/GroupId/);
  });
});

describe("GroupName", () => {
  it("exposes its value", () => {
    expect(GroupName.fromString("staff").toString()).toBe("staff");
  });

  it("rejects a blank name", () => {
    expect(() => GroupName.fromString("  ")).toThrow(/GroupName/);
  });
});
