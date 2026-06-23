import { describe, expect, it } from "vitest";

import { CreateIdentityProviderUseCase } from "../../../src/application/idp/create-identity-provider.use-case.js";
import { DeleteIdentityProviderUseCase } from "../../../src/application/idp/delete-identity-provider.use-case.js";
import { GetIdentityProviderUseCase } from "../../../src/application/idp/get-identity-provider.use-case.js";
import { ListIdentityProvidersUseCase } from "../../../src/application/idp/list-identity-providers.use-case.js";
import { ListIdpMappersUseCase } from "../../../src/application/idp/list-idp-mappers.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { IdpAlias } from "../../../src/domain/shared/idp-alias.js";
import { anIdp } from "../../support/identity-providers.js";
import { InMemoryIdentityProviderRepository } from "../../support/in-memory-identity-provider-repository.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("identity provider use cases", () => {
  it("lists identity providers", async () => {
    const repo = new InMemoryIdentityProviderRepository([anIdp("google")]);
    const idps = await new ListIdentityProvidersUseCase(repo).execute();
    expect(idps[0]?.alias.toString()).toBe("google");
  });

  it("gets an identity provider by alias", async () => {
    const repo = new InMemoryIdentityProviderRepository([anIdp("google")]);
    const idp = await new GetIdentityProviderUseCase(repo).execute(
      IdpAlias.fromString("google"),
    );
    expect(idp?.providerId).toBe("oidc");
  });

  it("returns null for an unknown alias", async () => {
    const idp = await new GetIdentityProviderUseCase(
      new InMemoryIdentityProviderRepository([]),
    ).execute(IdpAlias.fromString("ghost"));
    expect(idp).toBeNull();
  });

  it("creates an identity provider", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    await new CreateIdentityProviderUseCase(repo).execute({
      alias: IdpAlias.fromString("google"),
      providerId: "oidc",
      enabled: true,
      config: { clientId: "x" },
    });
    expect(repo.created[0]?.alias.toString()).toBe("google");
  });

  it("lists an identity provider's mappers", async () => {
    const repo = new InMemoryIdentityProviderRepository(
      [],
      [{ id: "m1", name: "email", type: "oidc-user-attribute" }],
    );
    const mappers = await new ListIdpMappersUseCase(repo).execute(
      IdpAlias.fromString("google"),
    );
    expect(mappers[0]?.name).toBe("email");
  });

  it("deletes an identity provider once confirmed", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const result = await new DeleteIdentityProviderUseCase(
      repo,
      approve,
    ).execute(IdpAlias.fromString("google"));
    expect(result.deleted).toBe(true);
    expect(repo.deletedAliases).toEqual(["google"]);
  });

  it("does not delete when declined", async () => {
    const repo = new InMemoryIdentityProviderRepository();
    const result = await new DeleteIdentityProviderUseCase(
      repo,
      decline,
    ).execute(IdpAlias.fromString("google"));
    expect(result.deleted).toBe(false);
    expect(repo.deletedAliases).toHaveLength(0);
  });
});
