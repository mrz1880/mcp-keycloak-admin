import type { RoleName } from "../shared/role-name.js";

/** Read model of a Keycloak realm role. */
export interface Role {
  readonly id: string;
  readonly name: RoleName;
  readonly description: string | null;
}
