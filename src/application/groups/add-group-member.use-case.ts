import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { GroupId } from "../../domain/shared/group-id.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface AddGroupMemberInput {
  readonly groupId: GroupId;
  readonly userId: UserId;
}

export class AddGroupMemberUseCase {
  constructor(private readonly groups: GroupRepository) {}

  execute(input: AddGroupMemberInput): Promise<void> {
    return this.groups.addMember(input.groupId, input.userId);
  }
}
