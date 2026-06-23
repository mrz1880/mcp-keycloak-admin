import type { Role } from "../../src/domain/role/role.js";
import { RoleName } from "../../src/domain/shared/role-name.js";

export function aRole(name: string, id = `role-${name}`): Role {
  return { id, name: RoleName.fromString(name), description: null };
}
