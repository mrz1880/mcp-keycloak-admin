import { describe, expect, it } from "vitest";

import { RealmAccessPolicy } from "../../../src/domain/policy/realm-access-policy.js";
import { RealmName } from "../../../src/domain/shared/realm-name.js";

describe("RealmAccessPolicy", () => {
  const demoRealm = RealmName.fromString("demo-realm");
  const master = RealmName.fromString("master");

  it("rejects a realm absent from a non-empty allow-list", () => {
    const policy = RealmAccessPolicy.of([demoRealm]);
    expect(() => policy.assertAllowed(master)).toThrow(/master/);
  });

  it("allows a realm present in the allow-list", () => {
    const policy = RealmAccessPolicy.of([demoRealm]);
    expect(() => policy.assertAllowed(demoRealm)).not.toThrow();
  });

  it("allows any realm when the allow-list is empty", () => {
    const policy = RealmAccessPolicy.of([]);
    expect(() => policy.assertAllowed(master)).not.toThrow();
  });
});
