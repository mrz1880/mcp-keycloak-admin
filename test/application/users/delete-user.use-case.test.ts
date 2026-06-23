import { describe, expect, it } from "vitest";

import { DeleteUserUseCase } from "../../../src/application/users/delete-user.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { Username } from "../../../src/domain/shared/username.js";
import { InMemoryUserRepository } from "../../support/in-memory-user-repository.js";
import { aUser } from "../../support/users.js";

const approving: Confirmer = { confirm: () => Promise.resolve(true) };
const declining: Confirmer = { confirm: () => Promise.resolve(false) };

describe("DeleteUserUseCase", () => {
  it("deletes the user once the operation is confirmed", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const useCase = new DeleteUserUseCase(repo, approving);

    const result = await useCase.execute({
      id: user.id,
      username: user.username,
    });

    expect(result.deleted).toBe(true);
    expect(repo.deletedIds).toEqual([user.id.toString()]);
  });

  it("does not delete when the operation is declined", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const useCase = new DeleteUserUseCase(repo, declining);

    const result = await useCase.execute({
      id: user.id,
      username: user.username,
    });

    expect(result.deleted).toBe(false);
    expect(repo.deletedIds).toEqual([]);
  });

  it("refuses to delete when the username does not match the id", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const useCase = new DeleteUserUseCase(repo, approving);

    const result = await useCase.execute({
      id: user.id,
      username: Username.fromString("someone-else"),
    });

    expect(result.deleted).toBe(false);
    expect(repo.deletedIds).toEqual([]);
  });

  it("describes the real impact (name and session count) to the confirmer", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    repo.sessionsById.set(user.id.toString(), 3);
    let description = "";
    const recording: Confirmer = {
      confirm: (operation) => {
        description = operation.describe();
        return Promise.resolve(false);
      },
    };

    await new DeleteUserUseCase(repo, recording).execute({
      id: user.id,
      username: user.username,
    });

    expect(description).toContain("jdupont");
    expect(description).toContain("3 active session");
  });
});
