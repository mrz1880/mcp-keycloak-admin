import type { Clock } from "../../domain/ports/clock.js";
import type { TokenProvider } from "../../domain/ports/token-provider.js";
import type { AccessToken } from "../../domain/shared/access-token.js";

const REFRESH_THRESHOLD_MS = 30_000;

export type FetchToken = () => Promise<AccessToken>;

/**
 * Caches a token and refreshes it shortly before expiry. Concurrent refreshes
 * share a single in-flight request.
 */
export class CachingTokenProvider implements TokenProvider {
  private cached: AccessToken | null = null;
  private inFlight: Promise<AccessToken> | null = null;

  constructor(
    private readonly fetchToken: FetchToken,
    private readonly clock: Clock,
  ) {}

  getToken(): Promise<AccessToken> {
    const current = this.cached;
    if (
      current !== null &&
      !current.isExpiringWithin(REFRESH_THRESHOLD_MS, this.clock.now())
    ) {
      return Promise.resolve(current);
    }
    this.inFlight ??= this.refresh();
    return this.inFlight;
  }

  private refresh(): Promise<AccessToken> {
    return this.fetchToken()
      .then((token) => {
        this.cached = token;
        this.inFlight = null;
        return token;
      })
      .catch((error: unknown) => {
        this.inFlight = null;
        throw error;
      });
  }
}
