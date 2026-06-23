import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildAuthTools } from "../../../src/infrastructure/mcp/auth-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryAuthenticationRepository } from "../../support/in-memory-authentication-repository.js";

describe("authentication tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildAuthTools({
      authenticationRepository: new InMemoryAuthenticationRepository(),
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_auth_flows_list",
      "keycloak_auth_required_actions_list",
    ]);
  });

  it("set-enabled handler toggles a required action", async () => {
    const repo = new InMemoryAuthenticationRepository();
    const tools = buildAuthTools({ authenticationRepository: repo });
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
});
