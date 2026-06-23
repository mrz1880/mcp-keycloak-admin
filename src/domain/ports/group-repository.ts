import type { Group } from "../group/group.js";
import type { GroupId } from "../shared/group-id.js";
import type { GroupName } from "../shared/group-name.js";
import type { UserId } from "../shared/user-id.js";

export interface GroupRepository {
  list(): Promise<Group[]>;
  create(name: GroupName): Promise<void>;
  delete(id: GroupId): Promise<void>;
  addMember(groupId: GroupId, userId: UserId): Promise<void>;
  removeMember(groupId: GroupId, userId: UserId): Promise<void>;
}
