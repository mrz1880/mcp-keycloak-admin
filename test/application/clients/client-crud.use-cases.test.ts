import { describe, expect, it } from "vitest";

import { CreateClientUseCase } from "../../../src/application/clients/create-client.use-case.js";
import { DeleteClientUseCase } from "../../../src/application/clients/delete-client.use-case.js";
import { UpdateClientUseCase } from "../../../src/application/clients/update-client.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ClientId } from "../../../src/domain/shared/client-id.js";
import { aClient } from "../../support/clients.js";
import { InMemoryClientRepository } from "../../support/in-memory-client-repository.js";

const UUID = "c0ffee00-1234-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("client CRUD use cases", () => {
  it("creates a client", async () => {
    const repo = new InMemoryClientRepository();
    await new CreateClientUseCase(repo).execute({
      clientId: ClientId.fromString("new-client"),
      enabled: true,
      publicClient: false,
      redirectUris: ["https://app/*"],
      webOrigins: [],
    });
    expect(repo.created[0]?.clientId.toString()).toBe("new-client");
  });

  it("updates an existing client", async () => {
    const repo = new InMemoryClientRepository([aClient("c", UUID)]);
    const result = await new UpdateClientUseCase(repo).execute({
      clientId: ClientId.fromString("c"),
      changes: { enabled: false },
    });
    expect(result.updated).toBe(true);
    expect(repo.updated[0]).toEqual({
      uuid: UUID,
      changes: { enabled: false },
    });
  });

  it("reports a missing client on update", async () => {
    const result = await new UpdateClientUseCase(
      new InMemoryClientRepository([]),
    ).execute({ clientId: ClientId.fromString("ghost"), changes: {} });
    expect(result.updated).toBe(false);
  });

  it("deletes a client once confirmed", async () => {
    const repo = new InMemoryClientRepository([aClient("c", UUID)]);
    const result = await new DeleteClientUseCase(repo, approve).execute(
      ClientId.fromString("c"),
    );
    expect(result.deleted).toBe(true);
    expect(repo.deletedUuids).toEqual([UUID]);
  });

  it("does not delete a client when declined", async () => {
    const repo = new InMemoryClientRepository([aClient("c", UUID)]);
    const result = await new DeleteClientUseCase(repo, decline).execute(
      ClientId.fromString("c"),
    );
    expect(result.deleted).toBe(false);
    expect(repo.deletedUuids).toHaveLength(0);
  });
});
