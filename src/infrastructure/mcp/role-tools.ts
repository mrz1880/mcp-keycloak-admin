import { z } from "zod";

import { AssignClientRoleUseCase } from "../../application/roles/assign-client-role.use-case.js";
import { AssignUserRoleUseCase } from "../../application/roles/assign-user-role.use-case.js";
import { GetUserClientRolesUseCase } from "../../application/roles/get-user-client-roles.use-case.js";
import { GetUserRolesUseCase } from "../../application/roles/get-user-roles.use-case.js";
import { ListClientRolesUseCase } from "../../application/roles/list-client-roles.use-case.js";
import { ListRealmRolesUseCase } from "../../application/roles/list-realm-roles.use-case.js";
import { UnassignClientRoleUseCase } from "../../application/roles/unassign-client-role.use-case.js";
import { UnassignUserRoleUseCase } from "../../application/roles/unassign-user-role.use-case.js";
import type { ClientRepository } from "../../domain/ports/client-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import type { Role } from "../../domain/role/role.js";
import { ClientId } from "../../domain/shared/client-id.js";
import { RoleName } from "../../domain/shared/role-name.js";
import { UserId } from "../../domain/shared/user-id.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface RoleToolDeps {
  readonly roleRepository: RoleRepository;
  readonly clientRepository: ClientRepository;
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

function listClientRolesTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_client_roles_list",
    title: "List client roles",
    description: "List the roles defined on a client.",
    level: ToolLevel.Read,
    inputSchema: { clientId: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const roles = await new ListClientRolesUseCase(
        deps.clientRepository,
        deps.roleRepository,
      ).execute(ClientId.fromString(String(args.clientId)));
      return textResult(
        roles === null
          ? "Client not found."
          : JSON.stringify(roles.map(serializeRole), null, 2),
      );
    },
  };
}

function getUserClientRolesTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_client_roles_get",
    title: "Get a user's client roles",
    description: "List the client roles assigned to a user for a client.",
    level: ToolLevel.Read,
    inputSchema: { userId: z.string(), clientId: z.string() },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const roles = await new GetUserClientRolesUseCase(
        deps.clientRepository,
        deps.roleRepository,
      ).execute({
        userId: UserId.fromString(String(args.userId)),
        clientId: ClientId.fromString(String(args.clientId)),
      });
      return textResult(
        roles === null
          ? "Client not found."
          : JSON.stringify(roles.map(serializeRole), null, 2),
      );
    },
  };
}

function assignClientRoleTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_client_role_assign",
    title: "Assign a client role to a user",
    description: "Grant a client role to a user.",
    level: ToolLevel.Write,
    inputSchema: {
      userId: z.string(),
      clientId: z.string(),
      role: z.string(),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const result = await new AssignClientRoleUseCase(
        deps.clientRepository,
        deps.roleRepository,
      ).execute({
        userId: UserId.fromString(String(args.userId)),
        clientId: ClientId.fromString(String(args.clientId)),
        role: RoleName.fromString(String(args.role)),
      });
      return textResult(
        result.assigned
          ? `Client role "${String(args.role)}" assigned.`
          : `Not assigned: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function unassignClientRoleTool(deps: RoleToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_client_role_unassign",
    title: "Remove a client role from a user",
    description: "Revoke a client role from a user. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: {
      userId: z.string(),
      clientId: z.string(),
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
      const result = await new UnassignClientRoleUseCase(
        deps.clientRepository,
        deps.roleRepository,
        confirmer,
      ).execute({
        userId: UserId.fromString(String(args.userId)),
        clientId: ClientId.fromString(String(args.clientId)),
        role: RoleName.fromString(String(args.role)),
      });
      return textResult(
        result.removed
          ? `Client role "${String(args.role)}" removed.`
          : `Not removed: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

export function buildRoleTools(deps: RoleToolDeps): ToolDefinition[] {
  return [
    listRealmRolesTool(deps),
    getUserRolesTool(deps),
    listClientRolesTool(deps),
    getUserClientRolesTool(deps),
    assignUserRoleTool(deps),
    assignClientRoleTool(deps),
    unassignUserRoleTool(deps),
    unassignClientRoleTool(deps),
  ];
}
