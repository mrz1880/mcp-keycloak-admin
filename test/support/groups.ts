import type { Group } from "../../src/domain/group/group.js";
import { GroupId } from "../../src/domain/shared/group-id.js";
import { GroupName } from "../../src/domain/shared/group-name.js";

export function aGroup(
  name: string,
  id = "a1a1a1a1-17b7-4035-95a5-237a748eec03",
): Group {
  return {
    id: GroupId.fromString(id),
    name: GroupName.fromString(name),
    path: `/${name}`,
  };
}
