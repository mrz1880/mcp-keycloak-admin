import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { ActionEmailType } from "../../domain/shared/action-email-type.js";
import { Email } from "../../domain/shared/email.js";
import type { Password } from "../../domain/shared/password.js";
import { UserId } from "../../domain/shared/user-id.js";
import { Username } from "../../domain/shared/username.js";
import type { NewUser } from "../../domain/user/new-user.js";
import type { User } from "../../domain/user/user.js";
import type { UserSearchCriteria } from "../../domain/user/user-search-criteria.js";
import type { KeycloakAdminClient } from "./admin-client.js";
import { KeycloakError } from "./errors.js";

interface KeycloakUser {
  readonly id: string;
  readonly username: string;
  readonly email?: string;
  readonly enabled?: boolean;
}

function toUser(raw: KeycloakUser): User {
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

  async countActiveSessions(id: UserId): Promise<number> {
    const sessions = await this.client.getJson<unknown[]>(
      `/users/${id.toString()}/sessions`,
    );
    return sessions.length;
  }
}
