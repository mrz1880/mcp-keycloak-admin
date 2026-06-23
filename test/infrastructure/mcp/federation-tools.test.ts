import { describe, expect, it } from "vitest";

import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildFederationTools } from "../../../src/infrastructure/mcp/federation-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aFederationProvider } from "../../support/federation.js";
import { InMemoryFederationRepository } from "../../support/in-memory-federation-repository.js";

const ID = "fed00000-1234-4035-95a5-237a748eec03";

describe("federation tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildFederationTools({
      federationRepository: new InMemoryFederationRepository(),
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual(["keycloak_federation_list", "keycloak_federation_get"]);
  });

  it("sync handler triggers a sync", async () => {
    const repo = new InMemoryFederationRepository([
      aFederationProvider("corp", ID),
    ]);
    const tools = buildFederationTools({ federationRepository: repo });
    const sync = tools.find((tool) => tool.name === "keycloak_federation_sync");

    const result = await sync!.handler({ id: ID, mode: "full" });

    expect(result.content[0]?.text).toContain("completed");
    expect(repo.synced[0]?.mode).toBe("full");
  });
});
