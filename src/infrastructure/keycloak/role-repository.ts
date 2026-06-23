import type { RoleRepository } from "../../domain/ports/role-repository.js";
import type { Role } from "../../domain/role/role.js";
import type { ClientUuid } from "../../domain/shared/client-uuid.js";
import { RoleName } from "../../domain/shared/role-name.js";
import type { UserId } from "../../domain/shared/user-id.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakRole {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
}

function toRole(raw: KeycloakRole): Role {
  return {
    id: raw.id,
    name: RoleName.fromString(raw.name),
    description: raw.description ?? null,
  };
}

function toRepresentation(role: Role): { id: string; name: string } {
  return { id: role.id, name: role.name.toString() };
}

export class KeycloakRoleRepository implements RoleRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async listRealmRoles(): Promise<Role[]> {
    const raw = await this.client.list<KeycloakRole>("/roles");
    return raw.map(toRole);
  }

  async findRealmRole(name: RoleName): Promise<Role | null> {
    try {
      const raw = await this.client.getJson<KeycloakRole>(
        `/roles/${encodeURIComponent(name.toString())}`,
      );
      return toRole(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listUserRealmRoles(userId: UserId): Promise<Role[]> {
    const raw = await this.client.getJson<KeycloakRole[]>(
      `/users/${userId.toString()}/role-mappings/realm`,
    );
    return raw.map(toRole);
  }

  assignRealmRole(userId: UserId, role: Role): Promise<void> {
    return this.client.post(`/users/${userId.toString()}/role-mappings/realm`, [
      toRepresentation(role),
    ]);
  }

  removeRealmRole(userId: UserId, role: Role): Promise<void> {
    return this.client.delete(
      `/users/${userId.toString()}/role-mappings/realm`,
      [toRepresentation(role)],
    );
  }

  async listClientRoles(clientUuid: ClientUuid): Promise<Role[]> {
    const raw = await this.client.list<KeycloakRole>(
      `/clients/${clientUuid.toString()}/roles`,
    );
    return raw.map(toRole);
  }

  async findClientRole(
    clientUuid: ClientUuid,
    name: RoleName,
  ): Promise<Role | null> {
    try {
      const raw = await this.client.getJson<KeycloakRole>(
        `/clients/${clientUuid.toString()}/roles/${encodeURIComponent(name.toString())}`,
      );
      return toRole(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async listUserClientRoles(
    userId: UserId,
    clientUuid: ClientUuid,
  ): Promise<Role[]> {
    const raw = await this.client.getJson<KeycloakRole[]>(
      `/users/${userId.toString()}/role-mappings/clients/${clientUuid.toString()}`,
    );
    return raw.map(toRole);
  }

  assignClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void> {
    return this.client.post(
      `/users/${userId.toString()}/role-mappings/clients/${clientUuid.toString()}`,
      [toRepresentation(role)],
    );
  }

  removeClientRole(
    userId: UserId,
    clientUuid: ClientUuid,
    role: Role,
  ): Promise<void> {
    return this.client.delete(
      `/users/${userId.toString()}/role-mappings/clients/${clientUuid.toString()}`,
      [toRepresentation(role)],
    );
  }
}
