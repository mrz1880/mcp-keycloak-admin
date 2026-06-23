import { describe, expect, it } from "vitest";

import { GroupId } from "../../../src/domain/shared/group-id.js";
import { GroupName } from "../../../src/domain/shared/group-name.js";
import { UserId } from "../../../src/domain/shared/user-id.js";
import { KeycloakAdminClient } from "../../../src/infrastructure/keycloak/admin-client.js";
import { KeycloakGroupRepository } from "../../../src/infrastructure/keycloak/group-repository.js";
import { FakeFetch, jsonResponse } from "../../support/fake-fetch.js";
import { StubTokenProvider } from "../../support/stub-token-provider.js";

const config = { baseUrl: "http://kc:8080", realm: "demo-realm" };
const GROUP = "a1a1a1a1-17b7-4035-95a5-237a748eec03";
const USER = "93d199e4-17b7-4035-95a5-237a748eec03";

function makeRepo(responses: Response[]): {
  repo: KeycloakGroupRepository;
  fetch: FakeFetch;
} {
  const fetch = new FakeFetch(responses);
  const client = new KeycloakAdminClient(
    config,
    new StubTokenProvider(),
    fetch.fetchFn,
  );
  return { repo: new KeycloakGroupRepository(client), fetch };
}

describe("KeycloakGroupRepository", () => {
  it("lists groups", async () => {
    const { repo } = makeRepo([
      jsonResponse([{ id: GROUP, name: "staff", path: "/staff" }]),
    ]);
    const groups = await repo.list();
    expect(groups[0]?.name.toString()).toBe("staff");
  });

  it("creates a group with a POST", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 201 })]);
    await repo.create(GroupName.fromString("staff"));
    expect(fetch.requests[0]?.method).toBe("POST");
    expect(fetch.requests[0]?.body).toContain('"name":"staff"');
  });

  it("adds a member with a PUT to the user's group", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.addMember(GroupId.fromString(GROUP), UserId.fromString(USER));
    expect(fetch.requests[0]?.method).toBe("PUT");
    expect(fetch.requests[0]?.url).toContain(`/users/${USER}/groups/${GROUP}`);
  });

  it("removes a member with a DELETE", async () => {
    const { repo, fetch } = makeRepo([new Response(null, { status: 204 })]);
    await repo.removeMember(GroupId.fromString(GROUP), UserId.fromString(USER));
    expect(fetch.requests[0]?.method).toBe("DELETE");
    expect(fetch.requests[0]?.url).toContain(`/users/${USER}/groups/${GROUP}`);
  });
});
