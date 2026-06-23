import { describe, expect, it } from "vitest";

import { ListUserSessionsUseCase } from "../../../src/application/users/list-user-sessions.use-case.js";
import { UpdateUserUseCase } from "../../../src/application/users/update-user.use-case.js";
import { Email } from "../../../src/domain/shared/email.js";
import { InMemoryUserRepository } from "../../support/in-memory-user-repository.js";
import { aUser } from "../../support/users.js";

describe("user v2 use cases", () => {
  it("updates a user's fields", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    await new UpdateUserUseCase(repo).execute({
      id: user.id,
      changes: { email: Email.fromString("new@e.com"), enabled: false },
    });
    expect(repo.updates[0]?.id).toBe(user.id.toString());
    expect(repo.updates[0]?.changes.enabled).toBe(false);
  });

  it("lists a user's sessions", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    repo.sessionsList.set(user.id.toString(), [
      { id: "s1", ipAddress: "1.2.3.4", start: 1, lastAccess: 2 },
    ]);
    const sessions = await new ListUserSessionsUseCase(repo).execute(user.id);
    expect(sessions[0]?.id).toBe("s1");
  });
});
