import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { Username } from "../../domain/shared/username.js";

export interface DeleteUserInput {
  readonly id: UserId;
  /** Must match the stored user; guards against deleting the wrong id. */
  readonly username: Username;
}

export interface DeleteUserResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(input: DeleteUserInput): Promise<DeleteUserResult> {
    const user = await this.users.findById(input.id);
    if (user === null) {
      return { deleted: false, reason: "User not found" };
    }
    if (!user.username.equals(input.username)) {
      return {
        deleted: false,
        reason: "Username does not match the target user",
      };
    }

    const sessions = await this.users.countActiveSessions(input.id);
    const email = user.email === null ? "" : ` (${user.email.toString()})`;
    const operation = DestructiveOperation.of(
      `Delete user ${user.username.toString()}`,
      `Permanently deletes the account${email} and revokes ${sessions} active ` +
        `session(s). This is irreversible.`,
    );

    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }

    await this.users.delete(input.id);
    return { deleted: true };
  }
}
