import { describe, expect, it } from "vitest";

import { ListAuthFlowsUseCase } from "../../../src/application/authentication/list-auth-flows.use-case.js";
import { ListRequiredActionsUseCase } from "../../../src/application/authentication/list-required-actions.use-case.js";
import { SetRequiredActionEnabledUseCase } from "../../../src/application/authentication/set-required-action-enabled.use-case.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";

describe("authentication use cases", () => {
  it("lists authentication flows", async () => {
    const repo = new InMemoryAuthenticationRepository([
      { id: "1", alias: "browser", builtIn: true },
    ]);
    const flows = await new ListAuthFlowsUseCase(repo).execute();
    expect(flows[0]?.alias).toBe("browser");
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
