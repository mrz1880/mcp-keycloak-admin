import type { ActionEmailType } from "../shared/action-email-type.js";
import type { Password } from "../shared/password.js";
import { UserId } from "../shared/user-id.js";
import type { NewUser } from "../user/new-user.js";
import type { User } from "../user/user.js";
import type { UserSearchCriteria } from "../user/user-search-criteria.js";
import type { UserSession } from "../user/user-session.js";
import type { UserUpdate } from "../user/user-update.js";

export interface UserRepository {
  search(criteria: UserSearchCriteria): Promise<User[]>;
  findById(id: UserId): Promise<User | null>;
  create(user: NewUser): Promise<void>;
  update(id: UserId, changes: UserUpdate): Promise<void>;
  setEnabled(id: UserId, enabled: boolean): Promise<void>;
  resetPassword(
    id: UserId,
    password: Password,
    temporary: boolean,
  ): Promise<void>;
  sendActionsEmail(id: UserId, actions: ActionEmailType[]): Promise<void>;
  listSessions(id: UserId): Promise<UserSession[]>;
  logout(id: UserId): Promise<void>;
  delete(id: UserId): Promise<void>;
  countActiveSessions(id: UserId): Promise<number>;
}
