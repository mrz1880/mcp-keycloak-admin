import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { UserUpdate } from "../../domain/user/user-update.js";

export interface UpdateUserInput {
  readonly id: UserId;
  readonly changes: UserUpdate;
}

export class UpdateUserUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(input: UpdateUserInput): Promise<void> {
    return this.users.update(input.id, input.changes);
  }
}
