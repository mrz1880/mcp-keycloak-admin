import { describe, expect, it } from "vitest";

import { AccessToken } from "../../../src/domain/shared/access-token.js";
import { CachingTokenProvider } from "../../../src/infrastructure/auth/caching-token-provider.js";
import { FakeClock } from "../../support/fake-clock.js";

describe("CachingTokenProvider", () => {
  it("fetches a token on the first call", async () => {
    let calls = 0;
    const provider = new CachingTokenProvider(() => {
      calls += 1;
      return Promise.resolve(AccessToken.issue("t1", 300_000));
    }, new FakeClock(0));

    expect((await provider.getToken()).toString()).toBe("t1");
    expect(calls).toBe(1);
  });

  it("reuses the cached token within its lifetime", async () => {
    let calls = 0;
    const provider = new CachingTokenProvider(() => {
      calls += 1;
      return Promise.resolve(AccessToken.issue("t1", 300_000));
    }, new FakeClock(0));

    await provider.getToken();
    await provider.getToken();

    expect(calls).toBe(1);
  });

  it("refreshes when the token is about to expire", async () => {
    let calls = 0;
    const clock = new FakeClock(0);
    const issued = ["t1", "t2"];
    const provider = new CachingTokenProvider(() => {
      const value = issued[calls] ?? "t?";
      calls += 1;
      return Promise.resolve(AccessToken.issue(value, clock.now() + 60_000));
    }, clock);

    const first = await provider.getToken();
    clock.advanceBy(40_000);
    const second = await provider.getToken();

    expect(first.toString()).toBe("t1");
    expect(second.toString()).toBe("t2");
    expect(calls).toBe(2);
  });

  it("deduplicates concurrent refreshes into a single request", async () => {
    let calls = 0;
    const provider = new CachingTokenProvider(() => {
      calls += 1;
      return new Promise<AccessToken>((resolve) =>
        setTimeout(() => resolve(AccessToken.issue("t1", 300_000)), 5),
      );
    }, new FakeClock(0));

    const [a, b] = await Promise.all([
      provider.getToken(),
      provider.getToken(),
    ]);

    expect(a.toString()).toBe("t1");
    expect(b.toString()).toBe("t1");
    expect(calls).toBe(1);
  });
});
