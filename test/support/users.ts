import { Email } from "../../src/domain/shared/email.js";
import { UserId } from "../../src/domain/shared/user-id.js";
import { Username } from "../../src/domain/shared/username.js";
import type { User } from "../../src/domain/user/user.js";

export function aUser(overrides: Partial<User> = {}): User {
  return {
    id: UserId.fromString("93d199e4-17b7-4035-95a5-237a748eec03"),
    username: Username.fromString("jdupont"),
    email: Email.fromString("jean.dupont@example.com"),
    enabled: true,
    ...overrides,
  };
}
