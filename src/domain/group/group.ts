import type { GroupId } from "../shared/group-id.js";
import type { GroupName } from "../shared/group-name.js";

/** Read model of a Keycloak group. */
export interface Group {
  readonly id: GroupId;
  readonly name: GroupName;
  readonly path: string;
}
