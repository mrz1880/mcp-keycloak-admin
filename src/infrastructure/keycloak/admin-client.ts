import type { TokenProvider } from "../../domain/ports/token-provider.js";
import type { FetchFn } from "../auth/token-endpoint.js";
import { toReadableKeycloakError } from "./errors.js";

export interface AdminClientConfig {
  readonly baseUrl: string;
  readonly realm: string;
}

const DEFAULT_PAGE_SIZE = 100;

export class KeycloakAdminClient {
  constructor(
    private readonly config: AdminClientConfig,
    private readonly tokens: TokenProvider,
    private readonly fetchFn: FetchFn,
  ) {}

  async getJson<T>(
    path: string,
    query: Record<string, string> = {},
  ): Promise<T> {
    const response = await this.send("GET", path, query);
    return (await response.json()) as T;
  }

  async post(path: string, body?: unknown): Promise<void> {
    await this.send("POST", path, {}, body);
  }

  async put(path: string, body?: unknown): Promise<void> {
    await this.send("PUT", path, {}, body);
  }

  async delete(path: string, body?: unknown): Promise<void> {
    await this.send("DELETE", path, {}, body);
  }

  /** Fetches every page of a list endpoint using Keycloak's first/max paging. */
  async list<T>(
    path: string,
    query: Record<string, string> = {},
    pageSize = DEFAULT_PAGE_SIZE,
  ): Promise<T[]> {
    const all: T[] = [];
    let first = 0;
    for (;;) {
      const page = await this.getJson<T[]>(path, {
        ...query,
        first: String(first),
        max: String(pageSize),
      });
      all.push(...page);
      if (page.length < pageSize) {
        break;
      }
      first += pageSize;
    }
    return all;
  }

  private url(path: string, query: Record<string, string>): string {
    const base = `${this.config.baseUrl}/admin/realms/${this.config.realm}${path}`;
    const params = new URLSearchParams(query).toString();
    return params.length === 0 ? base : `${base}?${params}`;
  }

  private async send(
    method: string,
    path: string,
    query: Record<string, string>,
    body?: unknown,
    attempt = 0,
  ): Promise<Response> {
    const token = await this.tokens.getToken();
    const headers: Record<string, string> = {
      authorization: `Bearer ${token.toString()}`,
    };
    const init: RequestInit = { method, headers };
    if (body !== undefined) {
      headers["content-type"] = "application/json";
      init.body = JSON.stringify(body);
    }

    const response = await this.fetchFn(this.url(path, query), init);

    if (response.status === 401 && attempt === 0) {
      return this.send(method, path, query, body, attempt + 1);
    }
    if (!response.ok) {
      throw toReadableKeycloakError(response.status, await safeJson(response));
    }
    return response;
  }
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}
