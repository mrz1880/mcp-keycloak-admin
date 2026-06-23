import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { Group } from "../../domain/group/group.js";
import type { UserId } from "../../domain/shared/user-id.js";

export class ListUserGroupsUseCase {
  constructor(private readonly groups: GroupRepository) {}

  execute(userId: UserId): Promise<Group[]> {
    return this.groups.userGroups(userId);
  }
}
