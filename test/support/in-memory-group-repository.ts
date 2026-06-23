import type { Group } from "../../src/domain/group/group.js";
import type { GroupRepository } from "../../src/domain/ports/group-repository.js";
import type { Role } from "../../src/domain/role/role.js";
import type { GroupId } from "../../src/domain/shared/group-id.js";
import type { GroupName } from "../../src/domain/shared/group-name.js";
import type { UserId } from "../../src/domain/shared/user-id.js";
import type { User } from "../../src/domain/user/user.js";

export class InMemoryGroupRepository implements GroupRepository {
  readonly created: string[] = [];
  readonly deletedIds: string[] = [];
  readonly added: { groupId: string; userId: string }[] = [];
  readonly removed: { groupId: string; userId: string }[] = [];
  readonly assignedRoles: { groupId: string; role: string }[] = [];
  readonly membersByGroup = new Map<string, User[]>();
  readonly groupsByUser = new Map<string, Group[]>();
  private readonly groups: Group[];

  constructor(groups: Group[] = []) {
    this.groups = groups;
  }

  assignRealmRole(groupId: GroupId, role: Role): Promise<void> {
    this.assignedRoles.push({
      groupId: groupId.toString(),
      role: role.name.toString(),
    });
    return Promise.resolve();
  }

  members(groupId: GroupId): Promise<User[]> {
    return Promise.resolve(this.membersByGroup.get(groupId.toString()) ?? []);
  }

  userGroups(userId: UserId): Promise<Group[]> {
    return Promise.resolve(this.groupsByUser.get(userId.toString()) ?? []);
  }

  list(): Promise<Group[]> {
    return Promise.resolve(this.groups);
  }

  create(name: GroupName): Promise<void> {
    this.created.push(name.toString());
    return Promise.resolve();
  }

  delete(id: GroupId): Promise<void> {
    this.deletedIds.push(id.toString());
    return Promise.resolve();
  }

  addMember(groupId: GroupId, userId: UserId): Promise<void> {
    this.added.push({ groupId: groupId.toString(), userId: userId.toString() });
    return Promise.resolve();
  }

  removeMember(groupId: GroupId, userId: UserId): Promise<void> {
    this.removed.push({
      groupId: groupId.toString(),
      userId: userId.toString(),
    });
    return Promise.resolve();
  }
}
