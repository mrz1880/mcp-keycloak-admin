/** A resource, policy or permission of a client's authorization services. */
export interface AuthzEntry {
  readonly id: string;
  readonly name: string;
  readonly type: string;
}
