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
    description: "List the realm's top-level groups.",
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
    description: "Create a top-level group.",
    level: ToolLevel.Write,
    inputSchema: { name: z.string() },
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
    description: "Add a user to a group.",
    level: ToolLevel.Write,
    inputSchema: { groupId: z.string(), userId: z.string() },
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
    description: "Remove a user from a group. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: {
      groupId: z.string(),
      userId: z.string(),
      confirm: z.boolean().optional(),
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
    description: "Delete a group. Requires confirmation.",
    level: ToolLevel.Destructive,
    inputSchema: { id: z.string(), confirm: z.boolean().optional() },
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
    description: "Grant a realm role to a group (inherited by its members).",
    level: ToolLevel.Write,
    inputSchema: { groupId: z.string(), role: z.string() },
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
    description: "List the users that are members of a group.",
    level: ToolLevel.Read,
    inputSchema: { groupId: z.string() },
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
    description: "List the groups a user belongs to.",
    level: ToolLevel.Read,
    inputSchema: { userId: z.string() },
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
