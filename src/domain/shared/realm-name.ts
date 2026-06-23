import { ensureNonBlank } from "./guards.js";

export class RealmName {
  private constructor(private readonly value: string) {}

  static fromString(value: string): RealmName {
    return new RealmName(ensureNonBlank(value, "RealmName"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: RealmName): boolean {
    return this.value === other.value;
  }
}
