import type { Group } from "../group/group.js";
import type { Role } from "../role/role.js";
import type { GroupId } from "../shared/group-id.js";
import type { GroupName } from "../shared/group-name.js";
import type { UserId } from "../shared/user-id.js";
import type { User } from "../user/user.js";

export interface GroupRepository {
  list(): Promise<Group[]>;
  create(name: GroupName): Promise<void>;
  delete(id: GroupId): Promise<void>;
  addMember(groupId: GroupId, userId: UserId): Promise<void>;
  removeMember(groupId: GroupId, userId: UserId): Promise<void>;
  assignRealmRole(groupId: GroupId, role: Role): Promise<void>;
  members(groupId: GroupId): Promise<User[]>;
  userGroups(userId: UserId): Promise<Group[]>;
}
