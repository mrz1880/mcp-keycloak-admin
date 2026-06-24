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
    description:
      "Read-only: lists all realm-level roles defined in the Keycloak realm (not client roles). Takes no parameters. Use this to discover available realm role names before assigning one with keycloak_user_role_assign; for roles scoped to a specific client, use keycloak_client_roles_list instead. Returns a JSON array of roles, each with id, name, and description.",
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
    description:
      "Read-only: lists the realm-level roles currently assigned to a single user (not client roles). Use this to inspect a user's realm role assignments before granting one with keycloak_user_role_assign or revoking one with keycloak_user_role_unassign; for client-scoped assignments use keycloak_user_client_roles_get. Returns a JSON array of roles, each with id, name, and description.",
    level: ToolLevel.Read,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user whose realm roles are listed.",
        ),
    },
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
    description:
      "Write: grants a single realm-level role to a user (not a client role). This is idempotent — assigning a role the user already has succeeds without changing anything. The role must already exist in the realm; list candidates with keycloak_role_list and verify current assignments with keycloak_user_roles_get. Returns a confirmation that the role was assigned, or a message explaining why it was not (for example, the user or role was not found).",
    level: ToolLevel.Write,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user who receives the role.",
        ),
      role: z
        .string()
        .describe(
          "The name of an existing realm role to grant (e.g. 'admin'), as returned by keycloak_role_list. This is the role name, not its ID.",
        ),
    },
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
    description:
      "Destructive write: revokes a single realm-level role from a user (not a client role), removing the access that role grants. This action requires explicit confirmation and will not proceed unless 'confirm' is true. Use keycloak_user_roles_get first to see the user's current realm roles; for client-scoped roles use keycloak_user_client_role_unassign instead. Returns a confirmation that the role was removed, or a message explaining why it was not (for example, confirmation was declined or the user or role was not found).",
    level: ToolLevel.Destructive,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user the role is removed from.",
        ),
      role: z
        .string()
        .describe(
          "The name of the realm role to revoke (e.g. 'admin'), as shown by keycloak_user_roles_get. This is the role name, not its ID.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Explicit confirmation gate for this destructive removal. Must be set to true to actually revoke the role; if omitted or false, the operation is declined and no change is made.",
        ),
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
    description:
      "Read-only: lists the client-level roles defined on a single Keycloak client (not realm roles). Use this to discover available client role names before assigning one with keycloak_user_client_role_assign; for realm-wide roles use keycloak_role_list instead. Returns a JSON array of roles (each with id, name, and description), or the message 'Client not found.' when no client matches the given ID.",
    level: ToolLevel.Read,
    inputSchema: {
      clientId: z
        .string()
        .describe(
          "The Keycloak client's internal ID (the client's UUID, e.g. 'a1b2c3d4-...'), not the human-readable clientId/client name. Identifies the client whose roles are listed.",
        ),
    },
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
    description:
      "Read-only: lists the client-level roles assigned to a single user for one specific client (not realm roles). Use this to inspect a user's client role assignments before granting one with keycloak_user_client_role_assign or revoking one with keycloak_user_client_role_unassign; for realm-wide assignments use keycloak_user_roles_get. Returns a JSON array of roles (each with id, name, and description), or the message 'Client not found.' when no client matches the given ID.",
    level: ToolLevel.Read,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user whose client roles are listed.",
        ),
      clientId: z
        .string()
        .describe(
          "The Keycloak client's internal ID (the client's UUID), not the human-readable clientId/client name. Scopes the listing to roles belonging to this client.",
        ),
    },
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
    description:
      "Write: grants a single client-level role (belonging to one specific client) to a user, not a realm role. This is idempotent — assigning a role the user already has succeeds without changing anything. The role must already exist on the client; list candidates with keycloak_client_roles_list and verify current assignments with keycloak_user_client_roles_get. Returns a confirmation that the client role was assigned, or a message explaining why it was not (for example, the user, client, or role was not found).",
    level: ToolLevel.Write,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user who receives the client role.",
        ),
      clientId: z
        .string()
        .describe(
          "The Keycloak client's internal ID (the client's UUID), not the human-readable clientId/client name. Identifies the client that owns the role being granted.",
        ),
      role: z
        .string()
        .describe(
          "The name of an existing client role to grant (e.g. 'manage-users'), as returned by keycloak_client_roles_list. This is the role name, not its ID.",
        ),
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
    description:
      "Destructive write: revokes a single client-level role (belonging to one specific client) from a user, removing the access that role grants; this is not a realm role. This action requires explicit confirmation and will not proceed unless 'confirm' is true. Use keycloak_user_client_roles_get first to see the user's current client roles; for realm-wide roles use keycloak_user_role_unassign instead. Returns a confirmation that the client role was removed, or a message explaining why it was not (for example, confirmation was declined or the user, client, or role was not found).",
    level: ToolLevel.Destructive,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "The Keycloak user ID (the user's UUID, e.g. 'f47ac10b-58cc-4372-a567-0e02b2c3d479'), not the username. Identifies the user the client role is removed from.",
        ),
      clientId: z
        .string()
        .describe(
          "The Keycloak client's internal ID (the client's UUID), not the human-readable clientId/client name. Identifies the client that owns the role being revoked.",
        ),
      role: z
        .string()
        .describe(
          "The name of the client role to revoke (e.g. 'manage-users'), as shown by keycloak_user_client_roles_get. This is the role name, not its ID.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Explicit confirmation gate for this destructive removal. Must be set to true to actually revoke the client role; if omitted or false, the operation is declined and no change is made.",
        ),
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
