import { describe, expect, it } from "vitest";

import { SearchUsersUseCase } from "../../../src/application/users/search-users.use-case.js";
import { Email } from "../../../src/domain/shared/email.js";
import { Username } from "../../../src/domain/shared/username.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { InMemoryUserRepository } from "../../support/in-memory-user-repository.js";
import { aUser } from "../../support/users.js";

describe("SearchUsersUseCase", () => {
  it("returns only the users matching the email filter", async () => {
    const target = aUser({ email: Email.fromString("match@example.com") });
    const other = aUser({
      id: UserId.fromString("11111111-17b7-4035-95a5-237a748eec03"),
      username: Username.fromString("other"),
      email: Email.fromString("nope@example.com"),
    });
    const useCase = new SearchUsersUseCase(
      new InMemoryUserRepository([target, other]),
    );

    const result = await useCase.execute({
      email: Email.fromString("match@example.com"),
      first: 0,
      max: 20,
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.username.toString()).toBe("jdupont");
  });
});
