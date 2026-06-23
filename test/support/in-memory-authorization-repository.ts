import type { AuthzEntry } from "../../src/domain/authz/authorization.js";
import type { AuthorizationRepository } from "../../src/domain/ports/authorization-repository.js";

export class InMemoryAuthorizationRepository implements AuthorizationRepository {
  constructor(
    private readonly resourceList: AuthzEntry[] = [],
    private readonly policyList: AuthzEntry[] = [],
    private readonly permissionList: AuthzEntry[] = [],
  ) {}

  resources(): Promise<AuthzEntry[]> {
    return Promise.resolve(this.resourceList);
  }

  policies(): Promise<AuthzEntry[]> {
    return Promise.resolve(this.policyList);
  }

  permissions(): Promise<AuthzEntry[]> {
    return Promise.resolve(this.permissionList);
  }
}
