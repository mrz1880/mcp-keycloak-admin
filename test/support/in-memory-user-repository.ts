import type { UserRepository } from "../../src/domain/ports/user-repository.js";
import type { UserId } from "../../src/domain/shared/user-id.js";
import type { User } from "../../src/domain/user/user.js";
import type { UserSearchCriteria } from "../../src/domain/user/user-search-criteria.js";

export class InMemoryUserRepository implements UserRepository {
  private readonly users: User[];
  readonly deletedIds: string[] = [];
  readonly sessionsById = new Map<string, number>();

  constructor(users: User[] = []) {
    this.users = [...users];
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

  delete(id: UserId): Promise<void> {
    this.deletedIds.push(id.toString());
    return Promise.resolve();
  }

  countActiveSessions(id: UserId): Promise<number> {
    return Promise.resolve(this.sessionsById.get(id.toString()) ?? 0);
  }
}
