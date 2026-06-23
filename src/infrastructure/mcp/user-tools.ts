import { z } from "zod";

import { CreateUserUseCase } from "../../application/users/create-user.use-case.js";
import { DeleteUserUseCase } from "../../application/users/delete-user.use-case.js";
import { GetUserUseCase } from "../../application/users/get-user.use-case.js";
import { LogoutUserUseCase } from "../../application/users/logout-user.use-case.js";
import { ResetUserPasswordUseCase } from "../../application/users/reset-user-password.use-case.js";
import { SearchUsersUseCase } from "../../application/users/search-users.use-case.js";
import { SendActionEmailUseCase } from "../../application/users/send-action-email.use-case.js";
import { SetUserEnabledUseCase } from "../../application/users/set-user-enabled.use-case.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { ActionEmailType } from "../../domain/shared/action-email-type.js";
import { Email } from "../../domain/shared/email.js";
import { Password } from "../../domain/shared/password.js";
import { UserId } from "../../domain/shared/user-id.js";
import { Username } from "../../domain/shared/username.js";
import type { NewUser } from "../../domain/user/new-user.js";
import type { User } from "../../domain/user/user.js";
import type { UserSearchCriteria } from "../../domain/user/user-search-criteria.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface UserToolDeps {
  readonly userRepository: UserRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeUser(user: User): Record<string, unknown> {
  return {
    id: user.id.toString(),
    username: user.username.toString(),
    email: user.email?.toString() ?? null,
    enabled: user.enabled,
  };
}

function buildCriteria(args: Record<string, unknown>): UserSearchCriteria {
  const criteria: {
    email?: Email;
    username?: Username;
    search?: string;
    first: number;
    max: number;
  } = {
    first: typeof args.first === "number" ? args.first : 0,
    max: typeof args.max === "number" ? args.max : 20,
  };
  if (typeof args.email === "string") {
    criteria.email = Email.fromString(args.email);
  }
  if (typeof args.username === "string") {
    criteria.username = Username.fromString(args.username);
  }
  if (typeof args.search === "string") {
    criteria.search = args.search;
  }
  return criteria;
}

function searchUsersTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_search",
    title: "Search users",
    description: "Search realm users by email, username or free text.",
    level: ToolLevel.Read,
    inputSchema: {
      email: z.string().optional(),
      username: z.string().optional(),
      search: z.string().optional(),
      first: z.number().int().min(0).optional(),
      max: z.number().int().min(1).max(500).optional(),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const users = await new SearchUsersUseCase(deps.userRepository).execute(
        buildCriteria(args),
      );
      return textResult(JSON.stringify(users.map(serializeUser), null, 2));
    },
  };
}

function getUserTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_get",
    title: "Get user",
    description: "Fetch a single user by id.",
    level: ToolLevel.Read,
    inputSchema: { id: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const user = await new GetUserUseCase(deps.userRepository).execute(
        UserId.fromString(String(args.id)),
      );
      return textResult(
        user === null
          ? "User not found."
          : JSON.stringify(serializeUser(user), null, 2),
      );
    },
  };
}

function createUserTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_create",
    title: "Create user",
    description: "Create a realm user.",
    level: ToolLevel.Write,
    inputSchema: {
      username: z.string(),
      email: z.string().optional(),
      enabled: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const user: NewUser = {
        username: Username.fromString(String(args.username)),
        ...(typeof args.email === "string"
          ? { email: Email.fromString(args.email) }
          : {}),
        enabled: args.enabled !== false,
        emailVerified: args.emailVerified === true,
      };
      await new CreateUserUseCase(deps.userRepository).execute(user);
      return textResult(`User "${user.username.toString()}" created.`);
    },
  };
}

function setUserEnabledTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_set_enabled",
    title: "Enable or disable user",
    description: "Enable or disable a user account.",
    level: ToolLevel.Write,
    inputSchema: { id: z.string(), enabled: z.boolean() },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const enabled = args.enabled === true;
      await new SetUserEnabledUseCase(deps.userRepository).execute({
        id: UserId.fromString(String(args.id)),
        enabled,
      });
      return textResult(
        `User ${String(args.id)} ${enabled ? "enabled" : "disabled"}.`,
      );
    },
  };
}

function sendActionEmailTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_send_action_email",
    title: "Send action email",
    description:
      "Send a required-actions email (e.g. VERIFY_EMAIL, UPDATE_PASSWORD).",
    level: ToolLevel.Write,
    inputSchema: { id: z.string(), actions: z.array(z.string()) },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const raw = Array.isArray(args.actions) ? args.actions : [];
      const actions = raw.map((action) =>
        ActionEmailType.fromString(String(action)),
      );
      await new SendActionEmailUseCase(deps.userRepository).execute({
        id: UserId.fromString(String(args.id)),
        actions,
      });
      return textResult("Action email sent.");
    },
  };
}

function resetUserPasswordTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_reset_password",
    title: "Reset user password",
    description: "Set a new password for a user. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z.string(),
      password: z.string(),
      temporary: z.boolean().optional(),
      confirm: z.boolean().optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new ResetUserPasswordUseCase(
        deps.userRepository,
        confirmer,
      ).execute({
        id: UserId.fromString(String(args.id)),
        password: Password.fromString(String(args.password)),
        temporary: args.temporary === true,
      });
      return textResult(
        result.reset
          ? "Password reset."
          : `Not reset: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function logoutUserTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_logout",
    title: "Log out user",
    description: "Revoke all of a user's sessions. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: { id: z.string(), confirm: z.boolean().optional() },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new LogoutUserUseCase(
        deps.userRepository,
        confirmer,
      ).execute({ id: UserId.fromString(String(args.id)) });
      return textResult(
        result.loggedOut
          ? "User logged out."
          : `Not logged out: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function deleteUserTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_delete",
    title: "Delete user",
    description:
      "Permanently delete a user. Requires confirmation; the username must " +
      "match the target id.",
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z.string(),
      username: z.string(),
      confirm: z.boolean().optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteUserUseCase(
        deps.userRepository,
        confirmer,
      ).execute({
        id: UserId.fromString(String(args.id)),
        username: Username.fromString(String(args.username)),
      });
      if (!result.deleted) {
        return textResult(`Not deleted: ${result.reason ?? "unknown reason"}`);
      }
      return textResult(`User "${String(args.username)}" deleted.`);
    },
  };
}

export function buildUserTools(deps: UserToolDeps): ToolDefinition[] {
  return [
    searchUsersTool(deps),
    getUserTool(deps),
    createUserTool(deps),
    setUserEnabledTool(deps),
    sendActionEmailTool(deps),
    resetUserPasswordTool(deps),
    logoutUserTool(deps),
    deleteUserTool(deps),
  ];
}
