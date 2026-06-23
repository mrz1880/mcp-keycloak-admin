import { describe, expect, it } from "vitest";

import { ListAuthzPermissionsUseCase } from "../../../src/application/authz/list-authz-permissions.use-case.js";
import { ListAuthzPoliciesUseCase } from "../../../src/application/authz/list-authz-policies.use-case.js";
import { ListAuthzResourcesUseCase } from "../../../src/application/authz/list-authz-resources.use-case.js";
import { ClientId } from "../../../src/domain/shared/client-id.js";
import { aClient } from "../../support/clients.js";
import { InMemoryAuthorizationRepository } from "../../support/in-memory-authorization-repository.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";

describe("authorization use cases", () => {
  it("lists a known client's resources", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const authz = new InMemoryAuthorizationRepository([
      { id: "r1", name: "res", type: "resource" },
    ]);
    const result = await new ListAuthzResourcesUseCase(clients, authz).execute(
      ClientId.fromString("mcp-admin"),
    );
    expect(result?.[0]?.name).toBe("res");
  });

  it("returns null for an unknown client", async () => {
    const result = await new ListAuthzResourcesUseCase(
      new InMemoryClientRepository([]),
      new InMemoryAuthorizationRepository(),
    ).execute(ClientId.fromString("ghost"));
    expect(result).toBeNull();
  });

  it("lists policies and permissions", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const authz = new InMemoryAuthorizationRepository(
      [],
      [{ id: "p1", name: "pol", type: "role" }],
      [{ id: "perm1", name: "perm", type: "resource" }],
    );
    const policies = await new ListAuthzPoliciesUseCase(clients, authz).execute(
      ClientId.fromString("mcp-admin"),
    );
    const permissions = await new ListAuthzPermissionsUseCase(
      clients,
      authz,
    ).execute(ClientId.fromString("mcp-admin"));
    expect(policies?.[0]?.name).toBe("pol");
    expect(permissions?.[0]?.name).toBe("perm");
  });
});
