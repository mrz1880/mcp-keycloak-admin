import { describe, expect, it } from "vitest";

import { AddGroupMemberUseCase } from "../../../src/application/groups/add-group-member.use-case.js";
import { CreateGroupUseCase } from "../../../src/application/groups/create-group.use-case.js";
import { DeleteGroupUseCase } from "../../../src/application/groups/delete-group.use-case.js";
import { ListGroupsUseCase } from "../../../src/application/groups/list-groups.use-case.js";
import { RemoveGroupMemberUseCase } from "../../../src/application/groups/remove-group-member.use-case.js";
import type { Confirmer } from "../../../src/domain/ports/confirmer.js";
import { GroupId } from "../../../src/domain/shared/group-id.js";
import { GroupName } from "../../../src/domain/shared/group-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { InMemoryGroupRepository } from "../../support/in-memory-group-repository.js";
import { aGroup } from "../../support/groups.js";

const GROUP = "a1a1a1a1-17b7-4035-95a5-237a748eec03";
const USER = "93d199e4-17b7-4035-95a5-237a748eec03";
const approve: Confirmer = { confirm: () => Promise.resolve(true) };
const decline: Confirmer = { confirm: () => Promise.resolve(false) };

describe("group use cases", () => {
  it("lists groups", async () => {
    const repo = new InMemoryGroupRepository([aGroup("staff")]);
    const groups = await new ListGroupsUseCase(repo).execute();
    expect(groups[0]?.name.toString()).toBe("staff");
  });

  it("creates a group", async () => {
    const repo = new InMemoryGroupRepository();
    await new CreateGroupUseCase(repo).execute(GroupName.fromString("staff"));
    expect(repo.created).toEqual(["staff"]);
  });

  it("adds a member", async () => {
    const repo = new InMemoryGroupRepository();
    await new AddGroupMemberUseCase(repo).execute({
      groupId: GroupId.fromString(GROUP),
      userId: UserId.fromString(USER),
    });
    expect(repo.added[0]).toEqual({ groupId: GROUP, userId: USER });
  });

  it("deletes a group once confirmed", async () => {
    const repo = new InMemoryGroupRepository();
    const result = await new DeleteGroupUseCase(repo, approve).execute(
      GroupId.fromString(GROUP),
    );
    expect(result.deleted).toBe(true);
    expect(repo.deletedIds).toEqual([GROUP]);
  });

  it("does not delete a group when declined", async () => {
    const repo = new InMemoryGroupRepository();
    const result = await new DeleteGroupUseCase(repo, decline).execute(
      GroupId.fromString(GROUP),
    );
    expect(result.deleted).toBe(false);
    expect(repo.deletedIds).toHaveLength(0);
  });

  it("removes a member once confirmed", async () => {
    const repo = new InMemoryGroupRepository();
    const result = await new RemoveGroupMemberUseCase(repo, approve).execute({
      groupId: GroupId.fromString(GROUP),
      userId: UserId.fromString(USER),
    });
    expect(result.removed).toBe(true);
    expect(repo.removed[0]).toEqual({ groupId: GROUP, userId: USER });
  });
});
