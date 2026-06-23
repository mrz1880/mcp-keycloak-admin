import type { FetchFn } from "../../src/infrastructure/auth/token-endpoint.js";

export interface CapturedRequest {
  readonly url: string;
  readonly method: string;
  readonly authorization: string | undefined;
  readonly body: string | undefined;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

/** Replays a queue of responses and records every request it receives. */
export class FakeFetch {
  readonly requests: CapturedRequest[] = [];
  private readonly responses: Response[];

  constructor(responses: Response[]) {
    this.responses = responses;
  }

  readonly fetchFn: FetchFn = (url, init) => {
    const headers = (init?.headers ?? {}) as Record<string, string>;
    this.requests.push({
      url,
      method: init?.method ?? "GET",
      authorization: headers.authorization,
      body: init?.body === undefined ? undefined : String(init.body),
    });
    const response =
      this.responses[this.requests.length - 1] ??
      new Response("", { status: 500 });
    return Promise.resolve(response);
  };
}
