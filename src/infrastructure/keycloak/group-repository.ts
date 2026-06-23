import type { Group } from "../../domain/group/group.js";
import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { Role } from "../../domain/role/role.js";
import { GroupId } from "../../domain/shared/group-id.js";
import { GroupName } from "../../domain/shared/group-name.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { User } from "../../domain/user/user.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { toUser } from "./user-repository.js";

interface KeycloakGroup {
  readonly id: string;
  readonly name: string;
  readonly path?: string;
}

function toGroup(raw: KeycloakGroup): Group {
  return {
    id: GroupId.fromString(raw.id),
    name: GroupName.fromString(raw.name),
    path: raw.path ?? `/${raw.name}`,
  };
}

export class KeycloakGroupRepository implements GroupRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async list(): Promise<Group[]> {
    const raw = await this.client.getJson<KeycloakGroup[]>("/groups");
    return raw.map(toGroup);
  }

  create(name: GroupName): Promise<void> {
    return this.client.post("/groups", { name: name.toString() });
  }

  delete(id: GroupId): Promise<void> {
    return this.client.delete(`/groups/${id.toString()}`);
  }

  addMember(groupId: GroupId, userId: UserId): Promise<void> {
    return this.client.put(
      `/users/${userId.toString()}/groups/${groupId.toString()}`,
    );
  }

  removeMember(groupId: GroupId, userId: UserId): Promise<void> {
    return this.client.delete(
      `/users/${userId.toString()}/groups/${groupId.toString()}`,
    );
  }

  assignRealmRole(groupId: GroupId, role: Role): Promise<void> {
    return this.client.post(
      `/groups/${groupId.toString()}/role-mappings/realm`,
      [{ id: role.id, name: role.name.toString() }],
    );
  }

  async members(groupId: GroupId): Promise<User[]> {
    const raw = await this.client.getJson<
      { id: string; username: string; email?: string; enabled?: boolean }[]
    >(`/groups/${groupId.toString()}/members`);
    return raw.map(toUser);
  }

  async userGroups(userId: UserId): Promise<Group[]> {
    const raw = await this.client.getJson<
      { id: string; name: string; path?: string }[]
    >(`/users/${userId.toString()}/groups`);
    return raw.map(toGroup);
  }
}
