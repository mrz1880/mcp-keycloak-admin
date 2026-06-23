import type { Clock } from "../../domain/ports/clock.js";
import { AccessToken } from "../../domain/shared/access-token.js";

export type FetchFn = (url: string, init?: RequestInit) => Promise<Response>;

interface TokenResponse {
  readonly access_token: string;
  readonly expires_in: number;
}

export function tokenUrl(baseUrl: string, realm: string): string {
  return `${baseUrl}/realms/${realm}/protocol/openid-connect/token`;
}

export async function requestToken(
  fetchFn: FetchFn,
  url: string,
  form: Record<string, string>,
  clock: Clock,
): Promise<AccessToken> {
  const response = await fetchFn(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(form).toString(),
  });

  if (!response.ok) {
    throw new Error(
      `Authentication against Keycloak failed (HTTP ${String(response.status)})`,
    );
  }

  const json = (await response.json()) as TokenResponse;
  const expiresAt = clock.now() + json.expires_in * 1000;
  return AccessToken.issue(json.access_token, expiresAt);
}
