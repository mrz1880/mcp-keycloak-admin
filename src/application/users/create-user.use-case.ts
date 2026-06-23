import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { NewUser } from "../../domain/user/new-user.js";

export class CreateUserUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(user: NewUser): Promise<void> {
    return this.users.create(user);
  }
}
