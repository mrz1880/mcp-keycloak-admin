import { DestructiveOperation } from "../../domain/policy/destructive-operation.js";
import type { Confirmer } from "../../domain/ports/confirmer.js";
import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { GroupId } from "../../domain/shared/group-id.js";

export interface DeleteGroupResult {
  readonly deleted: boolean;
  readonly reason?: string;
}

export class DeleteGroupUseCase {
  constructor(
    private readonly groups: GroupRepository,
    private readonly confirmer: Confirmer,
  ) {}

  async execute(id: GroupId): Promise<DeleteGroupResult> {
    const operation = DestructiveOperation.of(
      `Delete group ${id.toString()}`,
      "Removes the group, its sub-groups, and every membership and role " +
        "mapping it carries. This is irreversible.",
    );
    if (!(await this.confirmer.confirm(operation))) {
      return { deleted: false, reason: "Operation not confirmed" };
    }
    await this.groups.delete(id);
    return { deleted: true };
  }
}
