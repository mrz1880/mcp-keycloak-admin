import { describe, expect, it } from "vitest";

import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakAuthenticationRepository } from "../../../src/infrastructure/keycloak/authentication-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };

function makeRepo(responses: Response[]): {
  repo: KeycloakAuthenticationRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakAuthenticationRepository(client), fetch };
}

describe("KeycloakAuthenticationRepository", () => {
  it("lists flows", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: "1", alias: "browser", builtIn: true }]),
    ]);
    const flows = await repo.listFlows();
    expect(flows[0]?.alias).toBe("browser");
  });

  it("lists flow executions", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([
        {
          id: "e1",
          displayName: "Cookie",
          requirement: "ALTERNATIVE",
          providerId: "auth-cookie",
          index: 0,
          level: 0,
        },
      ]),
    ]);
    const executions = await repo.listFlowExecutions("browser");
    expect(executions[0]?.providerId).toBe("auth-cookie");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/flows/browser/executions",
    );
  });

  it("lists authenticator providers", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: "auth-otp-form", displayName: "OTP Form" }]),
    ]);
    const providers = await repo.listAuthenticatorProviders();
    expect(providers[0]?.id).toBe("auth-otp-form");
  });

  it("copies a flow", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.copyFlow("browser", "browser-copy");
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/flows/browser/copy",
    );
    expect(fetch.requests[0]?.body).toContain('"newName":"browser-copy"');
  });

  it("binds a realm flow via GET then PUT merge", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({
        realm: "demo-realm",
        browserFlow: "browser",
        enabled: true,
      }),
      new Response(null, { status: 204 }),
    ]);
    await repo.bindRealmFlow("browserFlow", "browser-copy");
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"browserFlow":"browser-copy"');
    expect(fetch.requests[1]?.body).toContain('"enabled":true');
  });

  it("adds an execution", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.addExecution("browser-copy", "auth-otp-form");
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/flows/browser-copy/executions/execution",
    );
    expect(fetch.requests[0]?.body).toContain('"provider":"auth-otp-form"');
  });

  it("updates an execution requirement via GET list then PUT", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse([
        {
          id: "e1",
          displayName: "OTP Form",
          requirement: "DISABLED",
          providerId: "auth-otp-form",
        },
      ]),
      new Response(null, { status: 204 }),
    ]);
    await repo.updateExecutionRequirement("browser-copy", "e1", "REQUIRED");
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"requirement":"REQUIRED"');
    expect(fetch.requests[1]?.body).toContain('"id":"e1"');
  });

  it("raises and lowers execution priority", async () => {
    const { repo, fetch } = makeRepo([
      new Response(null, { status: 204 }),
      new Response(null, { status: 204 }),
    ]);
    await repo.raiseExecutionPriority("e1");
    await repo.lowerExecutionPriority("e1");
    expect(fetch.requests[0]?.url).toContain(
      "/authentication/executions/e1/raise-priority",
    );
    expect(fetch.requests[1]?.url).toContain(
      "/authentication/executions/e1/lower-priority",
    );
  });

  it("deletes an execution", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.deleteExecution("e1");
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain("/authentication/executions/e1");
  });

  it("lists required actions", async () => {
    const { repo } = makeRepo([
      jsonResponse([
        { alias: "VERIFY_EMAIL", name: "Verify Email", enabled: true },
      ]),
    ]);
    const actions = await repo.listRequiredActions();
    expect(actions[0]?.alias).toBe("VERIFY_EMAIL");
  });

  it("toggles a required action via GET then PUT", async () => {
    const { repo, fetch } = makeRepo([
      jsonResponse({
        alias: "VERIFY_EMAIL",
        name: "Verify Email",
        enabled: true,
      }),
      new Response(null, { status: 204 }),
    ]);
    await repo.setRequiredActionEnabled("VERIFY_EMAIL", false);
    expect(fetch.requests[0]?.method).toBe("GET");
    expect(fetch.requests[1]?.method).toBe("PUT");
    expect(fetch.requests[1]?.body).toContain('"enabled":false');
  });
});
