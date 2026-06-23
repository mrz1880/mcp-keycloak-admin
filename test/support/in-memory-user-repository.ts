import type { UserRepository } from "../../src/domain/ports/user-repository.js";
import type { ActionEmailType } from "../../src/domain/shared/action-email-type.js";
import type { Password } from "../../src/domain/shared/password.js";
import type { UserId } from "../../src/domain/shared/user-id.js";
import type { NewUser } from "../../src/domain/user/new-user.js";
import type { User } from "../../src/domain/user/user.js";
import type { UserSearchCriteria } from "../../src/domain/user/user-search-criteria.js";
import type { UserSession } from "../../src/domain/user/user-session.js";
import type { UserUpdate } from "../../src/domain/user/user-update.js";

export interface PasswordReset {
  readonly id: string;
  readonly password: string;
  readonly temporary: boolean;
}

export interface ActionEmailRequest {
  readonly id: string;
  readonly actions: string[];
}

export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[];
  readonly deletedIds: string[] = [];
  readonly createdUsers: NewUser[] = [];
  readonly enabledChanges: { id: string; enabled: boolean }[] = [];
  readonly passwordResets: PasswordReset[] = [];
  readonly sentEmails: ActionEmailRequest[] = [];
  readonly loggedOutIds: string[] = [];
  readonly sessionsById = new Map<string, number>();
  readonly sessionsList = new Map<string, UserSession[]>();
  readonly updates: { id: string; changes: UserUpdate }[] = [];

  constructor(users: User[] = []) {
    this.users = [...users];
  }

  update(id: UserId, changes: UserUpdate): Promise<void> {
    this.updates.push({ id: id.toString(), changes });
    return Promise.resolve();
  }

  listSessions(id: UserId): Promise<UserSession[]> {
    return Promise.resolve(this.sessionsList.get(id.toString()) ?? []);
  }

  search(criteria: UserSearchCriteria): Promise<User[]> {
    let result = this.users;
    const email = criteria.email;
    if (email !== undefined) {
      result = result.filter((user) => user.email?.equals(email) ?? false);
    }
    const username = criteria.username;
    if (username !== undefined) {
      result = result.filter((user) => user.username.equals(username));
    }
    return Promise.resolve(
      result.slice(criteria.first, criteria.first + criteria.max),
    );
  }

  findById(id: UserId): Promise<User | null> {
    return Promise.resolve(
      this.users.find((user) => user.id.equals(id)) ?? null,
    );
  }

  create(user: NewUser): Promise<void> {
    this.createdUsers.push(user);
    return Promise.resolve();
  }

  setEnabled(id: UserId, enabled: boolean): Promise<void> {
    this.enabledChanges.push({ id: id.toString(), enabled });
    return Promise.resolve();
  }

  resetPassword(
    id: UserId,
    password: Password,
    temporary: boolean,
  ): Promise<void> {
    this.passwordResets.push({
      id: id.toString(),
      password: password.reveal(),
      temporary,
    });
    return Promise.resolve();
  }

  sendActionsEmail(id: UserId, actions: ActionEmailType[]): Promise<void> {
    this.sentEmails.push({
      id: id.toString(),
      actions: actions.map((action) => action.toString()),
    });
    return Promise.resolve();
  }

  logout(id: UserId): Promise<void> {
    this.loggedOutIds.push(id.toString());
    return Promise.resolve();
  }

  delete(id: UserId): Promise<void> {
    this.deletedIds.push(id.toString());
    return Promise.resolve();
  }

  countActiveSessions(id: UserId): Promise<number> {
    return Promise.resolve(this.sessionsById.get(id.toString()) ?? 0);
  }
}
