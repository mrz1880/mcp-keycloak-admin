import { describe, expect, it } from "vitest";

import { CreateUserUseCase } from "../../../src/application/users/create-user.use-case.js";
import { GetUserUseCase } from "../../../src/application/users/get-user.use-case.js";
import { LogoutUserUseCase } from "../../../src/application/users/logout-user.use-case.js";
import { ResetUserPasswordUseCase } from "../../../src/application/users/reset-user-password.use-case.js";
import { SendActionEmailUseCase } from "../../../src/application/users/send-action-email.use-case.js";
import { SetUserEnabledUseCase } from "../../../src/application/users/set-user-enabled.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { ActionEmailType } from "../../../src/domain/shared/action-email-type.js";
import { Email } from "../../../src/domain/shared/email.js";
import { Password } from "../../../src/domain/shared/password.js";
import { Username } from "../../../src/domain/shared/username.js";
import { InMemoryUserRepository } from "../../support/in-memory-user-repository.js";
import { aUser } from "../../support/users.js";

const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("user write use cases", () => {
  it("creates a user", async () => {
    const repo = new InMemoryUserRepository();
    await new CreateUserUseCase(repo).execute({
      username: Username.fromString("newbie"),
      email: Email.fromString("n@e.com"),
      enabled: true,
      emailVerified: false,
    });
    expect(repo.createdUsers[0]?.username.toString()).toBe("newbie");
  });

  it("gets a user by id", async () => {
    const user = aUser();
    const found = await new GetUserUseCase(
      new InMemoryUserRepository([user]),
    ).execute(user.id);
    expect(found?.username.toString()).toBe("jdupont");
  });

  it("enables or disables a user", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    await new SetUserEnabledUseCase(repo).execute({
      id: user.id,
      enabled: false,
    });
    expect(repo.enabledChanges[0]).toEqual({
      id: user.id.toString(),
      enabled: false,
    });
  });

  it("sends an action email", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    await new SendActionEmailUseCase(repo).execute({
      id: user.id,
      actions: [ActionEmailType.fromString("VERIFY_EMAIL")],
    });
    expect(repo.sentEmails[0]?.actions).toEqual(["VERIFY_EMAIL"]);
  });

  it("resets a password once confirmed", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const result = await new ResetUserPasswordUseCase(repo, approve).execute({
      id: user.id,
      password: Password.fromString("new-pass"),
      temporary: false,
    });
    expect(result.reset).toBe(true);
    expect(repo.passwordResets[0]?.password).toBe("new-pass");
  });

  it("does not reset a password when declined", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const result = await new ResetUserPasswordUseCase(repo, decline).execute({
      id: user.id,
      password: Password.fromString("new-pass"),
      temporary: false,
    });
    expect(result.reset).toBe(false);
    expect(repo.passwordResets).toHaveLength(0);
  });

  it("logs out once confirmed", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    repo.sessionsById.set(user.id.toString(), 2);
    const result = await new LogoutUserUseCase(repo, approve).execute({
      id: user.id,
    });
    expect(result.loggedOut).toBe(true);
    expect(repo.loggedOutIds).toEqual([user.id.toString()]);
  });

  it("does not log out when declined", async () => {
    const user = aUser();
    const repo = new InMemoryUserRepository([user]);
    const result = await new LogoutUserUseCase(repo, decline).execute({
      id: user.id,
    });
    expect(result.loggedOut).toBe(false);
    expect(repo.loggedOutIds).toHaveLength(0);
  });
});
