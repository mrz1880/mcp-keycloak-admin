import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { buildIdpTools } from "../../../src/infrastructure/mcp/idp-tools.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { InMemoryIdentityProviderRepository } from "../../support/in-memory-identity-provider-repository.js";

const decline: Confirmer = { confirm: () => Promise.resolve(false) };
const decliners: ConfirmerFactory = { create: () => decline };

describe("identity provider tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildIdpTools({
      identityProviderRepository: new InMemoryIdentityProviderRepository(),
      confirmers: decliners,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_idp_list",
      "keycloak_idp_get",
      "keycloak_idp_mappers_list",
    ]);
  });

  it("create handler creates a provider", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const tools = buildIdpTools({
      identityProviderRepository: repo,
      confirmers: decliners,
    });
    const create = tools.find((tool) => tool.name === "keycloak_idp_create");

    const result = await create!.handler({
      alias: "google",
      providerId: "oidc",
      config: { clientId: "x" },
    });

    expect(result.content[0]?.text).toContain("created");
    expect(repo.created).toHaveLength(1);
  });

  it("delete handler respects a refused confirmation", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const tools = buildIdpTools({
      identityProviderRepository: repo,
      confirmers: decliners,
    });
    const remove = tools.find((tool) => tool.name === "keycloak_idp_delete");

    const result = await remove!.handler({ alias: "google" });

    expect(result.content[0]?.text).toContain("Not deleted");
    expect(repo.deletedAliases).toHaveLength(0);
  });
});
