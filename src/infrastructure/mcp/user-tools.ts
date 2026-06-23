import { z } from "zod";

import { DeleteUserUseCase } from "../../application/users/delete-user.use-case.js";
import { SearchUsersUseCase } from "../../application/users/search-users.use-case.js";
import type { UserRepository } from "../../domain/ports/user-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { Email } from "../../domain/shared/email.js";
import { UserId } from "../../domain/shared/user-id.js";
import { Username } from "../../domain/shared/username.js";
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
  return [searchUsersTool(deps), deleteUserTool(deps)];
}
