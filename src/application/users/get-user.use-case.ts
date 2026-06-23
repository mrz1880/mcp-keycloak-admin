import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { User } from "../../domain/user/user.js";

export class GetUserUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(id: UserId): Promise<User | null> {
    return this.users.findById(id);
  }
}
