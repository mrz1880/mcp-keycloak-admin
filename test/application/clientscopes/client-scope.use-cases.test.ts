import { describe, expect, it } from "vitest";

import { AssignClientScopeUseCase } from "../../../src/application/clientscopes/assign-client-scope.use-case.js";
import { GetClientDefaultScopesUseCase } from "../../../src/application/clientscopes/get-client-default-scopes.use-case.js";
import { ListClientMappersUseCase } from "../../../src/application/clientscopes/list-client-mappers.use-case.js";
import { ListClientScopesUseCase } from "../../../src/application/clientscopes/list-client-scopes.use-case.js";
import { RemoveClientScopeUseCase } from "../../../src/application/clientscopes/remove-client-scope.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ClientId } from "../../../src/domain/shared/client-id.js";
import { ClientScopeName } from "../../../src/domain/shared/client-scope-name.js";
import { aClientScope } from "../../support/client-scopes.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";
import { InMemoryClientScopeRepository } from "../../support/in-memory-client-scope-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("client scope use cases", () => {
  it("lists client scopes", async () => {
    const scopes = new InMemoryClientScopeRepository([aClientScope("profile")]);
    const result = await new ListClientScopesUseCase(scopes).execute();
    expect(result[0]?.name.toString()).toBe("profile");
  });

  it("gets a known client's default scopes", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const scopes = new InMemoryClientScopeRepository(
      [],
      [aClientScope("profile")],
    );
    const result = await new GetClientDefaultScopesUseCase(
      clients,
      scopes,
    ).execute(ClientId.fromString("mcp-admin"));
    expect(result?.[0]?.name.toString()).toBe("profile");
  });

  it("returns null default scopes for an unknown client", async () => {
    const result = await new GetClientDefaultScopesUseCase(
      new InMemoryClientRepository([]),
      new InMemoryClientScopeRepository(),
    ).execute(ClientId.fromString("ghost"));
    expect(result).toBeNull();
  });

  it("lists a client's mappers", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const scopes = new InMemoryClientScopeRepository(
      [],
      [],
      [{ id: "m1", name: "email", protocol: "openid-connect", type: "oidc" }],
    );
    const result = await new ListClientMappersUseCase(clients, scopes).execute(
      ClientId.fromString("mcp-admin"),
    );
    expect(result?.[0]?.name).toBe("email");
  });

  it("assigns a scope by resolving client and scope", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const scopes = new InMemoryClientScopeRepository([aClientScope("profile")]);
    const result = await new AssignClientScopeUseCase(clients, scopes).execute({
      clientId: ClientId.fromString("mcp-admin"),
      scope: ClientScopeName.fromString("profile"),
    });
    expect(result.assigned).toBe(true);
    expect(scopes.assigned[0]?.clientUuid).toBe(UUID);
  });

  it("refuses to assign an unknown scope", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const result = await new AssignClientScopeUseCase(
      clients,
      new InMemoryClientScopeRepository([]),
    ).execute({
      clientId: ClientId.fromString("mcp-admin"),
      scope: ClientScopeName.fromString("ghost"),
    });
    expect(result.assigned).toBe(false);
  });

  it("removes a scope once confirmed", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const scopes = new InMemoryClientScopeRepository([aClientScope("profile")]);
    const result = await new RemoveClientScopeUseCase(
      clients,
      scopes,
      approve,
    ).execute({
      clientId: ClientId.fromString("mcp-admin"),
      scope: ClientScopeName.fromString("profile"),
    });
    expect(result.removed).toBe(true);
    expect(scopes.removed).toHaveLength(1);
  });

  it("does not remove a scope when declined", async () => {
    const clients = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const scopes = new InMemoryClientScopeRepository([aClientScope("profile")]);
    const result = await new RemoveClientScopeUseCase(
      clients,
      scopes,
      decline,
    ).execute({
      clientId: ClientId.fromString("mcp-admin"),
      scope: ClientScopeName.fromString("profile"),
    });
    expect(result.removed).toBe(false);
    expect(scopes.removed).toHaveLength(0);
  });
});
