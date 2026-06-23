import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface SetUserEnabledInput {
  readonly id: UserId;
  readonly enabled: boolean;
}

export class SetUserEnabledUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(input: SetUserEnabledInput): Promise<void> {
    return this.users.setEnabled(input.id, input.enabled);
  }
}
