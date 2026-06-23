import { describe, expect, it } from "vitest";

import { GetFederationProviderUseCase } from "../../../src/application/federation/get-federation-provider.use-case.js";
import { ListFederationProvidersUseCase } from "../../../src/application/federation/list-federation-providers.use-case.js";
import { SyncFederationUseCase } from "../../../src/application/federation/sync-federation.use-case.js";
import { ComponentId } from "../../../src/domain/shared/component-id.js";
import { aFederationProvider } from "../../support/federation.js";
import { InMemoryFederationRepository } from "../../support/in-memory-federation-repository.js";

const ID = "fed00000-1234-4035-95a5-237a748eec03";

describe("federation use cases", () => {
  it("lists federation providers", async () => {
    const repo = new InMemoryFederationRepository([
      aFederationProvider("corp"),
    ]);
    const providers = await new ListFederationProvidersUseCase(repo).execute();
    expect(providers[0]?.name).toBe("corp");
  });

  it("gets a provider by id", async () => {
    const repo = new InMemoryFederationRepository([
      aFederationProvider("corp", ID),
    ]);
    const provider = await new GetFederationProviderUseCase(repo).execute(
      ComponentId.fromString(ID),
    );
    expect(provider?.name).toBe("corp");
  });

  it("returns null for an unknown id", async () => {
    const provider = await new GetFederationProviderUseCase(
      new InMemoryFederationRepository([]),
    ).execute(ComponentId.fromString(ID));
    expect(provider).toBeNull();
  });

  it("triggers a sync", async () => {
    const repo = new InMemoryFederationRepository();
    const result = await new SyncFederationUseCase(repo).execute({
      id: ComponentId.fromString(ID),
      mode: "full",
    });
    expect(result.status).toBe("completed");
    expect(repo.synced[0]).toEqual({ id: ID, mode: "full" });
  });
});
