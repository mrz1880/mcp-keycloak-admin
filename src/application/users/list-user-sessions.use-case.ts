import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { UserSession } from "../../domain/user/user-session.js";

export class ListUserSessionsUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(id: UserId): Promise<UserSession[]> {
    return this.users.listSessions(id);
  }
}
