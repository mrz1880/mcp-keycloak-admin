import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { ActionEmailType } from "../../domain/shared/action-email-type.js";
import { Email } from "../../domain/shared/email.js";
import type { Password } from "../../domain/shared/password.js";
import { UserId } from "../../domain/shared/user-id.js";
import { Username } from "../../domain/shared/username.js";
import type { NewUser } from "../../domain/user/new-user.js";
import type { User } from "../../domain/user/user.js";
import type { UserSearchCriteria } from "../../domain/user/user-search-criteria.js";
import type { UserSession } from "../../domain/user/user-session.js";
import type { UserUpdate } from "../../domain/user/user-update.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakUser {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly enabled?: boolean;
}

interface KeycloakSession {
  readonly id?: string;
  readonly ipAddress?: string;
  readonly start?: number;
  readonly lastAccess?: number;
}

export function toUser(raw: KeycloakUser): User {
  return {
    id: UserId.fromString(raw.id),
    username: Username.fromString(raw.username),
    email:
      raw.email === undefined || raw.email === ""
        ? null
        : Email.fromString(raw.email),
    enabled: raw.enabled ?? false,
  };
}

export class KeycloakUserRepository implements UserRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  search(criteria: UserSearchCriteria): Promise<User[]> {
    const query: Record<string, string> = {
      first: String(criteria.first),
      max: String(criteria.max),
    };
    if (criteria.email !== undefined) {
      query.email = criteria.email.toString();
    }
    if (criteria.username !== undefined) {
      query.username = criteria.username.toString();
    }
    if (criteria.search !== undefined) {
      query.search = criteria.search;
    }
    return this.client
      .getJson<KeycloakUser[]>("/users", query)
      .then((raw) => raw.map(toUser));
  }

  async findById(id: UserId): Promise<User | null> {
    try {
      const raw = await this.client.getJson<KeycloakUser>(
        `/users/${id.toString()}`,
      );
      return toUser(raw);
    } catch (error) {
      if (error instanceof KeycloakError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  create(user: NewUser): Promise<void> {
    return this.client.post("/users", {
      username: user.username.toString(),
      ...(user.email === undefined ? {} : { email: user.email.toString() }),
      enabled: user.enabled,
      emailVerified: user.emailVerified,
    });
  }

  update(id: UserId, changes: UserUpdate): Promise<void> {
    const body: Record<string, unknown> = {};
    if (changes.email !== undefined) {
      body.email = changes.email.toString();
    }
    if (changes.firstName !== undefined) {
      body.firstName = changes.firstName;
    }
    if (changes.lastName !== undefined) {
      body.lastName = changes.lastName;
    }
    if (changes.enabled !== undefined) {
      body.enabled = changes.enabled;
    }
    return this.client.put(`/users/${id.toString()}`, body);
  }

  setEnabled(id: UserId, enabled: boolean): Promise<void> {
    return this.client.put(`/users/${id.toString()}`, { enabled });
  }

  resetPassword(
    id: UserId,
    password: Password,
    temporary: boolean,
  ): Promise<void> {
    return this.client.put(`/users/${id.toString()}/reset-password`, {
      type: "password",
      value: password.reveal(),
      temporary,
    });
  }

  sendActionsEmail(id: UserId, actions: ActionEmailType[]): Promise<void> {
    return this.client.put(
      `/users/${id.toString()}/execute-actions-email`,
      actions.map((action) => action.toString()),
    );
  }

  logout(id: UserId): Promise<void> {
    return this.client.post(`/users/${id.toString()}/logout`);
  }

  delete(id: UserId): Promise<void> {
    return this.client.delete(`/users/${id.toString()}`);
  }

  async listSessions(id: UserId): Promise<UserSession[]> {
    const raw = await this.client.getJson<KeycloakSession[]>(
      `/users/${id.toString()}/sessions`,
    );
    return raw.map((session) => ({
      id: session.id ?? "",
      ipAddress: session.ipAddress ?? null,
      start: session.start ?? 0,
      lastAccess: session.lastAccess ?? 0,
    }));
  }

  async countActiveSessions(id: UserId): Promise<number> {
    return (await this.listSessions(id)).length;
  }
}
