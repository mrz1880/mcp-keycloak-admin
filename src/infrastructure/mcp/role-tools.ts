import { z } from "zod";

import { AssignUserRoleUseCase } from "../../application/roles/assign-user-role.use-case.js";
import { GetUserRolesUseCase } from "../../application/roles/get-user-roles.use-case.js";
import { ListRealmRolesUseCase } from "../../application/roles/list-realm-roles.use-case.js";
import { UnassignUserRoleUseCase } from "../../application/roles/unassign-user-role.use-case.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import type { Role } from "../../domain/role/role.js";
import { RoleName } from "../../domain/shared/role-name.js";
import { UserId } from "../../domain/shared/user-id.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface RoleToolDeps {
  readonly roleRepository: RoleRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeRole(role: Role): Record<string, unknown> {
  return {
    id: role.id,
    name: role.name.toString(),
    description: role.description,
  };
}

function listRealmRolesTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_role_list",
    title: "List realm roles",
    description: "List the realm roles.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const roles = await new ListRealmRolesUseCase(
        deps.roleRepository,
      ).execute();
      return textResult(JSON.stringify(roles.map(serializeRole), null, 2));
    },
  };
}

function getUserRolesTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_roles_get",
    title: "Get a user's realm roles",
    description: "List the realm roles assigned to a user.",
    level: ToolLevel.Read,
    inputSchema: { userId: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const roles = await new GetUserRolesUseCase(deps.roleRepository).execute(
        UserId.fromString(String(args.userId)),
      );
      return textResult(JSON.stringify(roles.map(serializeRole), null, 2));
    },
  };
}

function assignUserRoleTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_role_assign",
    title: "Assign a realm role to a user",
    description: "Grant a realm role to a user.",
    level: ToolLevel.Write,
    inputSchema: { userId: z.string(), role: z.string() },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const result = await new AssignUserRoleUseCase(
        deps.roleRepository,
      ).execute({
        userId: UserId.fromString(String(args.userId)),
        role: RoleName.fromString(String(args.role)),
      });
      return textResult(
        result.assigned
          ? `Role "${String(args.role)}" assigned.`
          : `Not assigned: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function unassignUserRoleTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_role_unassign",
    title: "Remove a realm role from a user",
    description: "Revoke a realm role from a user. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: {
      userId: z.string(),
      role: z.string(),
      confirm: z.boolean().optional(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new UnassignUserRoleUseCase(
        deps.roleRepository,
        confirmer,
      ).execute({
        userId: UserId.fromString(String(args.userId)),
        role: RoleName.fromString(String(args.role)),
      });
      return textResult(
        result.removed
          ? `Role "${String(args.role)}" removed.`
          : `Not removed: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildRoleTools(deps: RoleToolDeps): ToolDefinition[] {
  return [
    listRealmRolesTool(deps),
    getUserRolesTool(deps),
    assignUserRoleTool(deps),
    unassignUserRoleTool(deps),
  ];
}
