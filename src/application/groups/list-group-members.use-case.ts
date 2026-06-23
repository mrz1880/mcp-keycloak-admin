import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { GroupId } from "../../domain/shared/group-id.js";
import type { User } from "../../domain/user/user.js";

export class ListGroupMembersUseCase {
  constructor(private readonly groups: GroupRepository) {}

  execute(groupId: GroupId): Promise<User[]> {
    return this.groups.members(groupId);
  }
}
