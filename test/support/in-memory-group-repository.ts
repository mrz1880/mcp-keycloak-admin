import type { Group } from "../../src/domain/group/group.js";
import type { GroupRepository } from "../../src/domain/ports/group-repository.js";
import type { GroupId } from "../../src/domain/shared/group-id.js";
import type { GroupName } from "../../src/domain/shared/group-name.js";
import type { UserId } from "../../src/domain/shared/user-id.js";

export class InMemoryGroupRepository implements GroupRepository {
  readonly created: string[] = [];
  readonly deletedIds: string[] = [];
  readonly added: { groupId: string; userId: string }[] = [];
  readonly removed: { groupId: string; userId: string }[] = [];
  private readonly groups: Group[];

  constructor(groups: Group[] = []) {
    this.groups = groups;
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
