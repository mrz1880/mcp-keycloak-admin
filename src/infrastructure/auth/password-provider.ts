import type { Clock } from "../../domain/ports/clock.js";
import type { TokenProvider } from "../../domain/ports/token-provider.js";
import { CachingTokenProvider } from "./caching-token-provider.js";
import { type FetchFn, requestToken, tokenUrl } from "./token-endpoint.js";

export interface PasswordConfig {
  readonly baseUrl: string;
  readonly realm: string;
  readonly username: string;
  readonly password: string;
}

export function createPasswordProvider(
  config: PasswordConfig,
  fetchFn: FetchFn,
  clock: Clock,
): TokenProvider {
  const url = tokenUrl(config.baseUrl, config.realm);
  return new CachingTokenProvider(
    () =>
      requestToken(
        fetchFn,
        url,
        {
          grant_type: "password",
          client_id: "admin-cli",
          username: config.username,
          password: config.password,
        },
        clock,
      ),
    clock,
  );
}
