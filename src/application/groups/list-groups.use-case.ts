import type { Group } from "../../domain/group/group.js";
import type { GroupRepository } from "../../domain/ports/group-repository.js";

export class ListGroupsUseCase {
  constructor(private readonly groups: GroupRepository) {}

  execute(): Promise<Group[]> {
    return this.groups.list();
  }
}
