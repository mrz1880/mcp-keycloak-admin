import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { ActionEmailType } from "../../domain/shared/action-email-type.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface SendActionEmailInput {
  readonly id: UserId;
  readonly actions: ActionEmailType[];
}

export class SendActionEmailUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(input: SendActionEmailInput): Promise<void> {
    return this.users.sendActionsEmail(input.id, input.actions);
  }
}
