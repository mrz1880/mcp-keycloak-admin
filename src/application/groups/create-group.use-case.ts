import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { GroupName } from "../../domain/shared/group-name.js";

export class CreateGroupUseCase {
  constructor(private readonly groups: GroupRepository) {}

  execute(name: GroupName): Promise<void> {
    return this.groups.create(name);
  }
}
