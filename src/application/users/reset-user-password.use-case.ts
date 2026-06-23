import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { Password } from "../../domain/shared/password.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface ResetUserPasswordInput {
  readonly id: UserId;
  readonly password: Password;
  readonly temporary: boolean;
}

export interface ResetUserPasswordResult {
  readonly reset: boolean;
  readonly reason?: string;
}

export class ResetUserPasswordUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(
    input: ResetUserPasswordInput,
  ): Promise<ResetUserPasswordResult> {
    const user = await this.users.findById(input.id);
    if (user === null) {
      return { reset: false, reason: "User not found" };
    }

    const operation = DestructiveOperation.of(
      `Reset password for ${user.username.toString()}`,
      `The current password stops working immediately${
        input.temporary ? " and the user must set a new one at next login" : ""
      }.`,
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { reset: false, reason: "Operation not confirmed" };
    }

    await this.users.resetPassword(input.id, input.password, input.temporary);
    return { reset: true };
  }
}
