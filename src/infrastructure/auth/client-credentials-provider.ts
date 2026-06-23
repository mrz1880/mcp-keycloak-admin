import type { Clock } from "../../domain/ports/clock.js";
import type { TokenProvider } from "../../domain/ports/token-provider.js";
import { CachingTokenProvider } from "./caching-token-provider.js";
import { type FetchFn, requestToken, tokenUrl } from "./token-endpoint.js";

export interface ClientCredentialsConfig {
  readonly baseUrl: string;
  readonly realm: string;
  readonly clientId: string;
  readonly clientSecret: string;
}

export function createClientCredentialsProvider(
  config: ClientCredentialsConfig,
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
          grant_type: "client_credentials",
          client_id: config.clientId,
          client_secret: config.clientSecret,
        },
        clock,
      ),
    clock,
  );
}
