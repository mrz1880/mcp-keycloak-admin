import { RealmName } from "../shared/realm-name.js";

/** Enforces the optional realm allow-list. An empty list allows every realm. */
export class RealmAccessPolicy {
  private constructor(private readonly allowed: readonly RealmName[]) {}

  static of(allowed: readonly RealmName[]): RealmAccessPolicy {
    return new RealmAccessPolicy(allowed);
  }

  assertAllowed(realm: RealmName): void {
    if (this.allowed.length === 0) {
      return;
    }
    if (!this.allowed.some((candidate) => candidate.equals(realm))) {
      throw new Error(`Realm "${realm.toString()}" is not allowed`);
    }
  }
}
