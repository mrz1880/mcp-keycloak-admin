import { z } from "zod";

import { AddGroupMemberUseCase } from "../../application/groups/add-group-member.use-case.js";
import { AssignGroupRoleUseCase } from "../../application/groups/assign-group-role.use-case.js";
import { CreateGroupUseCase } from "../../application/groups/create-group.use-case.js";
import { DeleteGroupUseCase } from "../../application/groups/delete-group.use-case.js";
import { ListGroupMembersUseCase } from "../../application/groups/list-group-members.use-case.js";
import { ListGroupsUseCase } from "../../application/groups/list-groups.use-case.js";
import { ListUserGroupsUseCase } from "../../application/groups/list-user-groups.use-case.js";
import { RemoveGroupMemberUseCase } from "../../application/groups/remove-group-member.use-case.js";
import type { Group } from "../../domain/group/group.js";
import type { GroupRepository } from "../../domain/ports/group-repository.js";
import type { RoleRepository } from "../../domain/ports/role-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { GroupId } from "../../domain/shared/group-id.js";
import { GroupName } from "../../domain/shared/group-name.js";
import { RoleName } from "../../domain/shared/role-name.js";
import { UserId } from "../../domain/shared/user-id.js";
import type { User } from "../../domain/user/user.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface GroupToolDeps {
  readonly groupRepository: GroupRepository;
  readonly roleRepository: RoleRepository;
  readonly confirmers: ConfirmerFactory;
}

function serializeGroup(group: Group): Record<string, unknown> {
  return {
    id: group.id.toString(),
    name: group.name.toString(),
    path: group.path,
  };
}

function serializeUser(user: User): Record<string, unknown> {
  return {
    id: user.id.toString(),
    username: user.username.toString(),
    email: user.email?.toString() ?? null,
    enabled: user.enabled,
  };
}

function listGroupsTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_list",
    title: "List groups",
    description:
      "Read-only. Lists the realm's top-level groups. Use this to discover group IDs and names before calling group write tools such as keycloak_group_member_add, keycloak_group_role_assign, or keycloak_group_delete. Idempotent and takes no parameters; returns a JSON array of objects, each with the group id, name, and path.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const groups = await new ListGroupsUseCase(
        deps.groupRepository,
      ).execute();
      return textResult(JSON.stringify(groups.map(serializeGroup), null, 2));
    },
  };
}

function createGroupTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_create",
    title: "Create group",
    description:
      "Write operation. Creates a new top-level group in the realm with the given name. Not idempotent: calling it again with the same name creates or attempts another group rather than reusing one. Use keycloak_group_list afterward to obtain the new group's id. Returns a confirmation message containing the created group's name.",
    level: ToolLevel.Write,
    inputSchema: {
      name: z
        .string()
        .describe(
          'Name for the new top-level group, e.g. "engineering". Used verbatim as the group name; must be non-empty.',
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      await new CreateGroupUseCase(deps.groupRepository).execute(
        GroupName.fromString(String(args.name)),
      );
      return textResult(`Group "${String(args.name)}" created.`);
    },
  };
}

function addGroupMemberTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_member_add",
    title: "Add group member",
    description:
      "Write operation. Adds an existing user to an existing group by their IDs. Idempotent: adding a user already in the group leaves membership unchanged. Resolve the IDs first with keycloak_group_list and a user listing tool; to undo, use keycloak_group_member_remove. Returns a fixed confirmation message.",
    level: ToolLevel.Write,
    inputSchema: {
      groupId: z
        .string()
        .describe(
          'ID of the target group (the group\'s UUID as returned by keycloak_group_list), e.g. "7c2e...".',
        ),
      userId: z
        .string()
        .describe(
          'ID of the user to add (the user\'s UUID), e.g. "a1b2...". The user must already exist.',
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      await new AddGroupMemberUseCase(deps.groupRepository).execute({
        groupId: GroupId.fromString(String(args.groupId)),
        userId: UserId.fromString(String(args.userId)),
      });
      return textResult("User added to group.");
    },
  };
}

function removeGroupMemberTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_member_remove",
    title: "Remove group member",
    description:
      "Destructive write operation that requires confirmation. Removes a user from a group by their IDs. Not idempotent in effect since it gates on confirmation; resolve IDs with keycloak_group_list and keycloak_group_members_list first, and use keycloak_group_member_add to reverse it. Returns a message stating the user was removed, or, if confirmation was withheld, that it was not removed with the reason.",
    level: ToolLevel.Destructive,
    inputSchema: {
      groupId: z
        .string()
        .describe(
          "ID of the group to remove the member from (the group's UUID from keycloak_group_list).",
        ),
      userId: z
        .string()
        .describe("ID of the user (the user's UUID) to remove from the group."),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Set true to confirm and proceed with this destructive removal. When omitted or false, the operation is gated by interactive confirmation and may be declined.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new RemoveGroupMemberUseCase(
        deps.groupRepository,
        confirmer,
      ).execute({
        groupId: GroupId.fromString(String(args.groupId)),
        userId: UserId.fromString(String(args.userId)),
      });
      return textResult(
        result.removed
          ? "User removed from group."
          : `Not removed: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function deleteGroupTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_delete",
    title: "Delete group",
    description:
      "Destructive write operation that requires confirmation. Permanently deletes a group by its ID, including its membership and role assignments. This cannot be undone; find the ID with keycloak_group_list first. Returns a message confirming deletion, or, if confirmation was withheld, that it was not deleted with the reason.",
    level: ToolLevel.Destructive,
    inputSchema: {
      id: z
        .string()
        .describe(
          "ID of the group to delete (the group's UUID as returned by keycloak_group_list).",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Set true to confirm and proceed with this destructive deletion. When omitted or false, the operation is gated by interactive confirmation and may be declined.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteGroupUseCase(
        deps.groupRepository,
        confirmer,
      ).execute(GroupId.fromString(String(args.id)));
      return textResult(
        result.deleted
          ? "Group deleted."
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function assignGroupRoleTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_role_assign",
    title: "Assign a realm role to a group",
    description:
      "Write operation. Grants an existing realm role to a group, so the group's members inherit that role. Idempotent: re-assigning an already-granted role makes no further change. Resolve the group ID with keycloak_group_list and ensure the realm role exists beforehand. Returns a message stating the role was assigned, or, if it could not be, that it was not assigned with the reason.",
    level: ToolLevel.Write,
    inputSchema: {
      groupId: z
        .string()
        .describe(
          "ID of the group to grant the role to (the group's UUID from keycloak_group_list).",
        ),
      role: z
        .string()
        .describe(
          'Name of an existing realm role to assign, e.g. "admin". Must match an existing realm role name exactly.',
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const result = await new AssignGroupRoleUseCase(
        deps.roleRepository,
        deps.groupRepository,
      ).execute({
        groupId: GroupId.fromString(String(args.groupId)),
        role: RoleName.fromString(String(args.role)),
      });
      return textResult(
        result.assigned
          ? `Role "${String(args.role)}" assigned to group.`
          : `Not assigned: ${result.reason ?? "unknown reason"}`,
      );
    },
  };
}

function listGroupMembersTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_group_members_list",
    title: "List group members",
    description:
      "Read-only and idempotent. Lists the users that are direct members of the given group. Resolve the group ID first with keycloak_group_list. Returns a JSON array of user objects, each with id, username, email (or null), and enabled status.",
    level: ToolLevel.Read,
    inputSchema: {
      groupId: z
        .string()
        .describe(
          "ID of the group whose members to list (the group's UUID from keycloak_group_list).",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const members = await new ListGroupMembersUseCase(
        deps.groupRepository,
      ).execute(GroupId.fromString(String(args.groupId)));
      return textResult(JSON.stringify(members.map(serializeUser), null, 2));
    },
  };
}

function listUserGroupsTool(deps: GroupToolDeps): ToolDefinition {
  return {
    name: "keycloak_user_groups_list",
    title: "List a user's groups",
    description:
      "Read-only and idempotent. Lists the groups the given user belongs to. Resolve the user ID first with a user listing tool. Returns a JSON array of group objects, each with id, name, and path.",
    level: ToolLevel.Read,
    inputSchema: {
      userId: z
        .string()
        .describe(
          "ID of the user whose group memberships to list (the user's UUID).",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const groups = await new ListUserGroupsUseCase(
        deps.groupRepository,
      ).execute(UserId.fromString(String(args.userId)));
      return textResult(JSON.stringify(groups.map(serializeGroup), null, 2));
    },
  };
}

export function buildGroupTools(deps: GroupToolDeps): ToolDefinition[] {
  return [
    listGroupsTool(deps),
    listGroupMembersTool(deps),
    listUserGroupsTool(deps),
    createGroupTool(deps),
    addGroupMemberTool(deps),
    assignGroupRoleTool(deps),
    removeGroupMemberTool(deps),
    deleteGroupTool(deps),
  ];
}
