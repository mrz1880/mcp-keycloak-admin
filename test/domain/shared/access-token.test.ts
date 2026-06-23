import { describe, expect, it } from "vitest";

import { AccessToken } from "../../../src/domain/shared/access-token.js";

describe("AccessToken", () => {
  it("exposes its raw bearer value", () => {
    expect(AccessToken.issue("abc", 1000).toString()).toBe("abc");
  });

  it("is expiring when within the threshold of expiry", () => {
    const token = AccessToken.issue("abc", 10_000);
    expect(token.isExpiringWithin(30_000, 9_990)).toBe(true);
  });

  it("is not expiring when comfortably before expiry", () => {
    const token = AccessToken.issue("abc", 100_000);
    expect(token.isExpiringWithin(30_000, 1_000)).toBe(false);
  });

  it("rejects an empty token", () => {
    expect(() => AccessToken.issue("", 1000)).toThrow(/AccessToken/);
  });
});
