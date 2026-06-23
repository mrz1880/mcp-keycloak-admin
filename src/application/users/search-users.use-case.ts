import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { User } from "../../domain/user/user.js";
import type { UserSearchCriteria } from "../../domain/user/user-search-criteria.js";

export class SearchUsersUseCase {
  constructor(private readonly users: UserRepository) {}

  execute(criteria: UserSearchCriteria): Promise<User[]> {
    return this.users.search(criteria);
  }
}
