import type { Role } from "../role/role.js";
import type { ClientUuid } from "../shared/client-uuid.js";
import type { RoleName } from "../shared/role-name.js";
import type { UserId } from "../shared/user-id.js";

export interface RoleRepository {
  listRealmRoles(): Promise<Role[]>;
  findRealmRole(name: RoleName): Promise<Role | null>;
  listUserRealmRoles(userId: UserId): Promise<Role[]>;
  assignRealmRole(userId: UserId, role: Role): Promise<void>;
  removeRealmRole(userId: UserId, role: Role): Promise<void>;

  listClientRoles(clientUuid: ClientUuid): Promise<Role[]>;
  findClientRole(clientUuid: ClientUuid, name: RoleName): Promise<Role | null>;
  listUserClientRoles(userId: UserId, clientUuid: ClientUuid): Promise<Role[]>;
  assignClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void>;
  removeClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void>;
}
