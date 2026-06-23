import { describe, expect, it } from "vitest";

import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ToolAccessPolicy } from "../../../src/domain/policy/tool-access-policy.js";
import { buildClientTools } from "../../../src/infrastructure/mcp/client-tools.js";
import type { ConfirmerFactory } from "../../../src/infrastructure/mcp/confirmation/confirmer-factory.js";
import { filterTools } from "../../../src/infrastructure/mcp/tool-registry.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const confirmers: ConfirmerFactory = { create: () => approve };

describe("client tools", () => {
  it("keeps only read tools under the read-only policy", () => {
    const tools = buildClientTools({
      clientRepository: new InMemoryClientRepository(),
      confirmers,
    });
    expect(
      filterTools(tools, ToolAccessPolicy.of(true)).map((tool) => tool.name),
    ).toEqual([
      "keycloak_client_list",
      "keycloak_client_get",
      "keycloak_client_get_secret",
    ]);
  });

  it("masks the secret unless reveal is true", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin", UUID)], {
      [UUID]: "s3cr3t",
    });
    const tools = buildClientTools({ clientRepository: repo, confirmers });
    const secretTool = tools.find(
      (tool) => tool.name === "keycloak_client_get_secret",
    );

    const masked = await secretTool!.handler({ clientId: "mcp-admin" });
    const revealed = await secretTool!.handler({
      clientId: "mcp-admin",
      reveal: true,
    });

    expect(masked.content[0]?.text).not.toContain("s3cr3t");
    expect(revealed.content[0]?.text).toBe("s3cr3t");
  });
});
