import { UserId } from "../shared/user-id.js";
import type { User } from "../user/user.js";
import type { UserSearchCriteria } from "../user/user-search-criteria.js";

export interface UserRepository {
  search(criteria: UserSearchCriteria): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  delete(id: UserId): Promise<void>;
  countActiveSessions(id: UserId): Promise<number>;
}
