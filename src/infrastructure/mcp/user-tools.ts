import { z } from "zod";

import { CreateUserUseCase } from "../../application/users/create-user.use-case.js";
import { DeleteUserUseCase } from "../../application/users/delete-user.use-case.js";
import { GetUserUseCase } from "../../application/users/get-user.use-case.js";
import { ListUserSessionsUseCase } from "../../application/users/list-user-sessions.use-case.js";
import { LogoutUserUseCase } from "../../application/users/logout-user.use-case.js";
import { ResetUserPasswordUseCase } from "../../application/users/reset-user-password.use-case.js";
import { SearchUsersUseCase } from "../../application/users/search-users.use-case.js";
import { SendActionEmailUseCase } from "../../application/users/send-action-email.use-case.js";
import { SetUserEnabledUseCase } from "../../application/users/set-user-enabled.use-case.js";
import { UpdateUserUseCase } from "../../application/users/update-user.use-case.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import type { UserUpdate } from "../../domain/user/user-update.js";
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
    description:
      "Read-only. Searches users in the configured realm and returns a JSON array of matches, each with id, username, email and enabled flag. Use this to discover a user's id before calling id-based tools such as keycloak_user_get, keycloak_user_update or keycloak_user_delete. All filters are optional and combined; with no filters it returns the first page of users. Results are paginated and capped at 500 per call.",
    level: ToolLevel.Read,
    inputSchema: {
      email: z
        .string()
        .optional()
        .describe(
          'Filter by email address (e.g. "jane@example.com"). Optional; omit to not filter by email.',
        ),
      username: z
        .string()
        .optional()
        .describe(
          'Filter by exact or partial username (e.g. "jane"). Optional; omit to not filter by username.',
        ),
      search: z
        .string()
        .optional()
        .describe(
          "Free-text search across username, email, first and last name. Optional; omit to not apply a text search.",
        ),
      first: z
        .number()
        .int()
        .min(0)
        .optional()
        .describe(
          "Zero-based offset of the first result, for pagination. Integer >= 0. Defaults to 0 when omitted.",
        ),
      max: z
        .number()
        .int()
        .min(1)
        .max(500)
        .optional()
        .describe(
          "Maximum number of users to return. Integer between 1 and 500. Defaults to 20 when omitted.",
        ),
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
    description:
      'Read-only. Fetches a single realm user by id and returns a JSON object with id, username, email and enabled flag, or the text "User not found." if no user has that id. Use keycloak_user_search first if you only know a username or email and need the id. Idempotent: repeated calls return the same result without changing anything.',
    level: ToolLevel.Read,
    inputSchema: {
      id: z
        .string()
        .describe(
          'The Keycloak user id (UUID), e.g. "8f14e45f-ceea-467e-9b3c-1234567890ab". Required; obtain it from keycloak_user_search.',
        ),
    },
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
    description:
      "Write operation that creates a new realm user and returns a confirmation message with the username. It does not set a password, so call keycloak_user_reset_password afterwards to give the account credentials; it also does not send any email. Not idempotent: calling it again with the same username creates a conflict rather than a duplicate. Use keycloak_user_update to change an existing user instead of recreating it.",
    level: ToolLevel.Write,
    inputSchema: {
      username: z
        .string()
        .describe(
          'Login username for the new user (e.g. "jane.doe"). Required and must be unique within the realm.',
        ),
      email: z
        .string()
        .optional()
        .describe(
          'Email address for the new user (e.g. "jane@example.com"). Optional; omit to create the user without an email.',
        ),
      enabled: z
        .boolean()
        .optional()
        .describe(
          "Whether the account can log in. Optional; defaults to true (enabled) unless explicitly set to false.",
        ),
      emailVerified: z
        .boolean()
        .optional()
        .describe(
          "Whether the email is marked as already verified. Optional; defaults to false unless explicitly set to true.",
        ),
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
    description:
      "Write operation that enables or disables a single user account by id, returning a confirmation message. Disabling blocks the user from logging in but does not delete the account or revoke existing sessions; use keycloak_user_logout to terminate active sessions, or keycloak_user_delete to remove the account. Idempotent: setting the same enabled value repeatedly leaves the account in the same state.",
    level: ToolLevel.Write,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) of the account to enable or disable. Required; obtain it from keycloak_user_search.",
        ),
      enabled: z
        .boolean()
        .describe(
          "Target state: true to enable the account, false to disable it. Required.",
        ),
    },
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
      "Write operation that emails the user a link prompting them to complete one or more required actions (such as verifying their email or updating their password), and returns a confirmation message. The user must have a valid email address configured. Not idempotent: each call sends a fresh email. Use this for self-service flows; to set a password directly without involving the user, use keycloak_user_reset_password instead.",
    level: ToolLevel.Write,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) of the recipient. Required; obtain it from keycloak_user_search.",
        ),
      actions: z
        .array(z.string())
        .describe(
          'Required-action codes to include in the email, e.g. ["VERIFY_EMAIL", "UPDATE_PASSWORD"]. Required and must contain at least one valid Keycloak required-action key.',
        ),
    },
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
    description:
      'Destructive write that overwrites a user\'s password with the supplied value, returning "Password reset." on success or a "Not reset: <reason>" message if confirmation was declined. Requires explicit confirmation: pass confirm=true, otherwise the operation is blocked pending approval. Commonly used right after keycloak_user_create to give a new account credentials. Not idempotent in effect, since it invalidates the previous password.',
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) whose password will be set. Required; obtain it from keycloak_user_search.",
        ),
      password: z
        .string()
        .describe("The new plaintext password to set for the user. Required."),
      temporary: z
        .boolean()
        .optional()
        .describe(
          "If true, the user must change this password at next login. Optional; defaults to false (permanent password).",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed; if omitted or false, the reset is blocked pending confirmation. Optional; defaults to false.",
        ),
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
    description:
      'Destructive write that revokes all active sessions for a user, forcing them to re-authenticate, and returns "User logged out." on success or a "Not logged out: <reason>" message if confirmation was declined. Requires explicit confirmation: pass confirm=true, otherwise the operation is blocked pending approval. The account itself stays enabled; use keycloak_user_set_enabled to block future logins or keycloak_user_sessions_list to inspect sessions first. Effectively idempotent: once sessions are revoked, a repeat call has nothing left to revoke.',
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) whose sessions will be revoked. Required; obtain it from keycloak_user_search.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed; if omitted or false, the logout is blocked pending confirmation. Optional; defaults to false.",
        ),
    },
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
      'Destructive write that permanently removes a user from the realm, returning "User \\"<username>\\" deleted." on success or a "Not deleted: <reason>" message otherwise. As a wrong-target guard, the supplied username must match the user that the id resolves to, and confirm must be true; otherwise the deletion is blocked. Look up the id and username with keycloak_user_get or keycloak_user_search first. Not reversible; consider keycloak_user_set_enabled to disable instead of deleting.',
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) of the account to delete. Required; obtain it from keycloak_user_search.",
        ),
      username: z
        .string()
        .describe(
          "The username of the same account, used as a safety check: it must match the user that id resolves to or the deletion is refused. Required.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed; if omitted or false, the deletion is blocked pending confirmation. Optional; defaults to false.",
        ),
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

function updateUserTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_update",
    title: "Update user",
    description:
      "Write operation that updates an existing user's profile fields and returns a confirmation message. Only the fields you supply are changed; omitted fields are left untouched (no field is cleared by omission). Idempotent: applying the same values again leaves the user unchanged. Use keycloak_user_get first to read current values, and keycloak_user_reset_password for credentials rather than this tool.",
    level: ToolLevel.Write,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) of the account to update. Required; obtain it from keycloak_user_search.",
        ),
      email: z
        .string()
        .optional()
        .describe(
          'New email address (e.g. "jane@example.com"). Optional; omit to leave the email unchanged.',
        ),
      firstName: z
        .string()
        .optional()
        .describe(
          "New first (given) name. Optional; omit to leave it unchanged.",
        ),
      lastName: z
        .string()
        .optional()
        .describe(
          "New last (family) name. Optional; omit to leave it unchanged.",
        ),
      enabled: z
        .boolean()
        .optional()
        .describe(
          "New enabled state: true to allow login, false to block it. Optional; omit to leave it unchanged.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const changes: {
        email?: Email;
        firstName?: string;
        lastName?: string;
        enabled?: boolean;
      } = {};
      if (typeof args.email === "string") {
        changes.email = Email.fromString(args.email);
      }
      if (typeof args.firstName === "string") {
        changes.firstName = args.firstName;
      }
      if (typeof args.lastName === "string") {
        changes.lastName = args.lastName;
      }
      if (typeof args.enabled === "boolean") {
        changes.enabled = args.enabled;
      }
      await new UpdateUserUseCase(deps.userRepository).execute({
        id: UserId.fromString(String(args.id)),
        changes: changes satisfies UserUpdate,
      });
      return textResult(`User ${String(args.id)} updated.`);
    },
  };
}

function listUserSessionsTool(deps: UserToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_sessions_list",
    title: "List user sessions",
    description:
      "Read-only. Returns a JSON array of a user's currently active sessions (an empty array if none). Use it to inspect where a user is logged in before deciding whether to revoke access with keycloak_user_logout. Idempotent: it never changes any state and repeated calls reflect only sessions that are still active.",
    level: ToolLevel.Read,
    inputSchema: {
      id: z
        .string()
        .describe(
          "The Keycloak user id (UUID) whose active sessions to list. Required; obtain it from keycloak_user_search.",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const sessions = await new ListUserSessionsUseCase(
        deps.userRepository,
      ).execute(UserId.fromString(String(args.id)));
      return textResult(JSON.stringify(sessions, null, 2));
    },
  };
}

export function buildUserTools(deps: UserToolDeps): ToolDefinition[] {
  return [
    searchUsersTool(deps),
    getUserTool(deps),
    listUserSessionsTool(deps),
    createUserTool(deps),
    updateUserTool(deps),
    setUserEnabledTool(deps),
    sendActionEmailTool(deps),
    resetUserPasswordTool(deps),
    logoutUserTool(deps),
    deleteUserTool(deps),
  ];
}
