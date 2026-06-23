import { describe, expect, it } from "vitest";

import { AssignGroupRoleUseCase } from "../../../src/application/groups/assign-group-role.use-case.js";
import { ListGroupMembersUseCase } from "../../../src/application/groups/list-group-members.use-case.js";
import { ListUserGroupsUseCase } from "../../../src/application/groups/list-user-groups.use-case.js";
import { GroupId } from "../../../src/domain/shared/group-id.js";
import { RoleName } from "../../../src/domain/shared/role-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { InMemoryGroupRepository } from "../../support/in-memory-group-repository.js";
import { InMemoryRoleRepository } from "../../support/in-memory-role-repository.js";
import { aGroup } from "../../support/groups.js";
import { aRole } from "../../support/roles.js";
import { aUser } from "../../support/users.js";

const GROUP = GroupId.fromString("a1a1a1a1-17b7-4035-95a5-237a748eec03");
const USER = UserId.fromString("93d199e4-17b7-4035-95a5-237a748eec03");

describe("group v2 use cases", () => {
  it("assigns an existing realm role to a group", async () => {
    const groups = new InMemoryGroupRepository();
    const roles = new InMemoryRoleRepository([aRole("admin")]);
    const result = await new AssignGroupRoleUseCase(roles, groups).execute({
      groupId: GROUP,
      role: RoleName.fromString("admin"),
    });
    expect(result.assigned).toBe(true);
    expect(groups.assignedRoles[0]?.role).toBe("admin");
  });

  it("refuses to assign an unknown role to a group", async () => {
    const result = await new AssignGroupRoleUseCase(
      new InMemoryRoleRepository([]),
      new InMemoryGroupRepository(),
    ).execute({ groupId: GROUP, role: RoleName.fromString("ghost") });
    expect(result.assigned).toBe(false);
  });

  it("lists a group's members", async () => {
    const groups = new InMemoryGroupRepository();
    groups.membersByGroup.set(GROUP.toString(), [aUser()]);
    const members = await new ListGroupMembersUseCase(groups).execute(GROUP);
    expect(members[0]?.username.toString()).toBe("jdupont");
  });

  it("lists a user's groups", async () => {
    const groups = new InMemoryGroupRepository();
    groups.groupsByUser.set(USER.toString(), [aGroup("staff")]);
    const list = await new ListUserGroupsUseCase(groups).execute(USER);
    expect(list[0]?.name.toString()).toBe("staff");
  });
});
