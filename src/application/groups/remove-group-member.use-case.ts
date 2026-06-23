import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { GroupId } from "../../domain/shared/group-id.js";
import type { UserId } from "../../domain/shared/user-id.js";

export interface RemoveGroupMemberInput {
  readonly groupId: GroupId;
  readonly userId: UserId;
}

export interface RemoveGroupMemberResult {
  readonly removed: boolean;
  readonly reason?: string;
}

export class RemoveGroupMemberUseCase {
  constructor(
    private readonly groups: GroupRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(
    input: RemoveGroupMemberInput,
  ): Promise<RemoveGroupMemberResult> {
    const operation = DestructiveOperation.of(
      `Remove user ${input.userId.toString()} from group ${input.groupId.toString()}`,
      "The user loses every role and permission granted through this group.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { removed: false, reason: "Operation not confirmed" };
    }
    await this.groups.removeMember(input.groupId, input.userId);
    return { removed: true };
  }
}
