import { describe, expect, it } from "vitest";

import { GetClientSecretUseCase } from "../../../src/application/clients/get-client-secret.use-case.js";
import { GetClientUseCase } from "../../../src/application/clients/get-client.use-case.js";
import { ListClientsUseCase } from "../../../src/application/clients/list-clients.use-case.js";
import { RegenerateClientSecretUseCase } from "../../../src/application/clients/regenerate-client-secret.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ClientId } from "../../../src/domain/shared/client-id.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";
import { aClient } from "../../support/clients.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("client use cases", () => {
  it("lists clients", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin")]);
    const clients = await new ListClientsUseCase(repo).execute();
    expect(clients[0]?.clientId.toString()).toBe("mcp-admin");
  });

  it("gets a client by clientId", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin")]);
    const client = await new GetClientUseCase(repo).execute(
      ClientId.fromString("mcp-admin"),
    );
    expect(client?.clientId.toString()).toBe("mcp-admin");
  });

  it("reads a client secret by resolving the clientId", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin", UUID)], {
      [UUID]: "s3cr3t",
    });
    const secret = await new GetClientSecretUseCase(repo).execute(
      ClientId.fromString("mcp-admin"),
    );
    expect(secret?.reveal()).toBe("s3cr3t");
  });

  it("regenerates a secret once confirmed", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const result = await new RegenerateClientSecretUseCase(
      repo,
      approve,
    ).execute(ClientId.fromString("mcp-admin"));
    expect(result.regenerated).toBe(true);
    expect(result.secret?.reveal()).toBe("new-secret");
    expect(repo.regeneratedUuids).toEqual([UUID]);
  });

  it("does not regenerate when declined", async () => {
    const repo = new InMemoryClientRepository([aClient("mcp-admin", UUID)]);
    const result = await new RegenerateClientSecretUseCase(
      repo,
      decline,
    ).execute(ClientId.fromString("mcp-admin"));
    expect(result.regenerated).toBe(false);
    expect(repo.regeneratedUuids).toHaveLength(0);
  });
});
