import type { TokenProvider } from "../../src/domain/ports/token-provider.js";
import { AccessToken } from "../../src/domain/shared/access-token.js";

/** Returns the next token in the list on each call (last one repeats). */
export class StubTokenProvider implements TokenProvider {
  private calls = 0;
  private readonly tokens: string[];

  constructor(tokens: string[] = ["test-token"]) {
    this.tokens = tokens;
  }

  getToken(): Promise<AccessToken> {
    const index = Math.min(this.calls, this.tokens.length - 1);
    this.calls += 1;
    return Promise.resolve(
      AccessToken.issue(this.tokens[index] ?? "test-token", 9_999_999_999_999),
    );
  }
}
