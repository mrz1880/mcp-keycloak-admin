import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { buildAuthTools } from "../../../src/infrastructure/mcp/auth-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";

const confirmers: ConfirmerFactory = {
  create: (providedConfirm: boolean) => ({
    confirm: () => Promise.resolve(providedConfirm),
  }),
};

describe("authentication tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildAuthTools({
      authenticationRepository: new InMemoryAuthenticationRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_auth_flows_list",
      "keycloak_auth_flow_executions_list",
      "keycloak_auth_authenticator_providers_list",
      "keycloak_auth_required_actions_list",
    ]);
  });

  it("set-enabled handler toggles a required action", async () => {
    const repo = new InMemoryAuthenticationRepository();
    const tools = buildAuthTools({
      authenticationRepository: repo,
      confirmers,
    });
    const toggle = tools.find(
      (tool) => tool.name === "keycloak_auth_required_action_set_enabled",
    );

    const result = await toggle!.handler({
      alias: "VERIFY_EMAIL",
      enabled: false,
    });

    expect(result.content[0]?.text).toContain("disabled");
    expect(repo.toggled[0]?.enabled).toBe(false);
  });

  it("delete execution requires confirm", async () => {
    const repo = new InMemoryAuthenticationRepository();
    const tools = buildAuthTools({
      authenticationRepository: repo,
      confirmers,
    });
    const del = tools.find(
      (tool) => tool.name === "keycloak_auth_flow_execution_delete",
    );

    const skipped = await del!.handler({ executionId: "e1" });
    expect(skipped.content[0]?.text).toContain("Not deleted");
    expect(repo.deletedExecutions).toEqual([]);

    const deleted = await del!.handler({ executionId: "e1", confirm: true });
    expect(deleted.content[0]?.text).toContain("Deleted");
    expect(repo.deletedExecutions).toEqual(["e1"]);
  });
});
