import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface LogoutUserInput {
  readonly id: UserId;
}

export interface LogoutUserResult {
  readonly loggedOut: boolean;
  readonly reason?: string;
}

export class LogoutUserUseCase {
  constructor(
    private readonly users: UserRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(input: LogoutUserInput): Promise<LogoutUserResult> {
    const user = await this.users.findById(input.id);
    if (user === null) {
      return { loggedOut: false, reason: "User not found" };
    }

    const sessions = await this.users.countActiveSessions(input.id);
    const operation = DestructiveOperation.of(
      `Log out ${user.username.toString()}`,
      `Revokes ${String(sessions)} active session(s); the user must sign in again.`,
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { loggedOut: false, reason: "Operation not confirmed" };
    }

    await this.users.logout(input.id);
    return { loggedOut: true };
  }
}
