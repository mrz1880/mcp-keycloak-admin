import { describe, expect, it } from "vitest";

import { AddFlowExecutionUseCase } from "../../../src/application/authentication/add-flow-execution.use-case.js";
import { BindRealmFlowUseCase } from "../../../src/application/authentication/bind-realm-flow.use-case.js";
import { CopyAuthFlowUseCase } from "../../../src/application/authentication/copy-auth-flow.use-case.js";
import { DeleteFlowExecutionUseCase } from "../../../src/application/authentication/delete-flow-execution.use-case.js";
import { ListAuthFlowsUseCase } from "../../../src/application/authentication/list-auth-flows.use-case.js";
import { ListAuthenticatorProvidersUseCase } from "../../../src/application/authentication/list-authenticator-providers.use-case.js";
import { ListFlowExecutionsUseCase } from "../../../src/application/authentication/list-flow-executions.use-case.js";
import { ListRequiredActionsUseCase } from "../../../src/application/authentication/list-required-actions.use-case.js";
import { RaiseFlowExecutionPriorityUseCase } from "../../../src/application/authentication/raise-flow-execution-priority.use-case.js";
import { SetRequiredActionEnabledUseCase } from "../../../src/application/authentication/set-required-action-enabled.use-case.js";
import { UpdateFlowExecutionUseCase } from "../../../src/application/authentication/update-flow-execution.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";

const alwaysConfirm: Confirmer = {
  confirm: () => Promise.resolve(true),
};

const neverConfirm: Confirmer = {
  confirm: () => Promise.resolve(false),
};

describe("authentication use cases", () => {
  it("lists authentication flows", async () => {
    const repo = new InMemoryAuthenticationRepository([
      { id: "1", alias: "browser", builtIn: true },
    ]);
    const flows = await new ListAuthFlowsUseCase(repo).execute();
    expect(flows[0]?.alias).toBe("browser");
  });

  it("lists flow executions", async () => {
    const repo = new InMemoryAuthenticationRepository(
      [],
      [],
      new Map([
        [
          "browser",
          [
            {
              id: "e1",
              displayName: "Cookie",
              requirement: "ALTERNATIVE",
              index: 0,
              level: 0,
              providerId: "auth-cookie",
              authenticationFlow: false,
              configurable: false,
            },
          ],
        ],
      ]),
    );
    const executions = await new ListFlowExecutionsUseCase(repo).execute(
      "browser",
    );
    expect(executions[0]?.providerId).toBe("auth-cookie");
  });

  it("lists authenticator providers", async () => {
    const repo = new InMemoryAuthenticationRepository([], [], new Map(), [
      { id: "auth-otp-form", displayName: "OTP Form", description: "OTP" },
    ]);
    const providers = await new ListAuthenticatorProvidersUseCase(
      repo,
    ).execute();
    expect(providers[0]?.id).toBe("auth-otp-form");
  });

  it("copies a flow", async () => {
    const repo = new InMemoryAuthenticationRepository([
      { id: "1", alias: "browser", builtIn: true },
    ]);
    await new CopyAuthFlowUseCase(repo).execute({
      flowAlias: "browser",
      newName: "browser-copy",
    });
    expect(repo.copied[0]).toEqual({
      flowAlias: "browser",
      newName: "browser-copy",
    });
  });

  it("binds a realm flow", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new BindRealmFlowUseCase(repo).execute({
      binding: "browserFlow",
      flowAlias: "browser-copy",
    });
    expect(repo.bound[0]).toEqual({
      binding: "browserFlow",
      flowAlias: "browser-copy",
    });
  });

  it("adds an execution", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new AddFlowExecutionUseCase(repo).execute({
      flowAlias: "browser-copy",
      providerId: "auth-otp-form",
    });
    expect(repo.added[0]).toEqual({
      flowAlias: "browser-copy",
      providerId: "auth-otp-form",
    });
  });

  it("updates an execution requirement", async () => {
    const repo = new InMemoryAuthenticationRepository(
      [],
      [],
      new Map([
        [
          "browser-copy",
          [
            {
              id: "e1",
              displayName: "OTP",
              requirement: "DISABLED",
              index: 0,
              level: 0,
              providerId: "auth-otp-form",
              authenticationFlow: false,
              configurable: false,
            },
          ],
        ],
      ]),
    );
    await new UpdateFlowExecutionUseCase(repo).execute({
      flowAlias: "browser-copy",
      executionId: "e1",
      requirement: "REQUIRED",
    });
    expect(repo.updated[0]?.requirement).toBe("REQUIRED");
  });

  it("raises execution priority", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new RaiseFlowExecutionPriorityUseCase(repo).execute("e1");
    expect(repo.raised).toEqual(["e1"]);
  });

  it("deletes an execution when confirmed", async () => {
    const repo = new InMemoryAuthenticationRepository();
    const result = await new DeleteFlowExecutionUseCase(
      repo,
      alwaysConfirm,
    ).execute("e1");
    expect(result.deleted).toBe(true);
    expect(repo.deletedExecutions).toEqual(["e1"]);
  });

  it("skips delete when not confirmed", async () => {
    const repo = new InMemoryAuthenticationRepository();
    const result = await new DeleteFlowExecutionUseCase(
      repo,
      neverConfirm,
    ).execute("e1");
    expect(result.deleted).toBe(false);
    expect(repo.deletedExecutions).toEqual([]);
  });

  it("lists required actions", async () => {
    const repo = new InMemoryAuthenticationRepository(
      [],
      [
        {
          alias: "VERIFY_EMAIL",
          name: "Verify Email",
          enabled: true,
          defaultAction: false,
        },
      ],
    );
    const actions = await new ListRequiredActionsUseCase(repo).execute();
    expect(actions[0]?.alias).toBe("VERIFY_EMAIL");
  });

  it("toggles a required action", async () => {
    const repo = new InMemoryAuthenticationRepository();
    await new SetRequiredActionEnabledUseCase(repo).execute({
      alias: "VERIFY_EMAIL",
      enabled: false,
    });
    expect(repo.toggled[0]).toEqual({ alias: "VERIFY_EMAIL", enabled: false });
  });
});
