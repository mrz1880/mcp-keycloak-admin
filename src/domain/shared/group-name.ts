import { ensureNonBlank } from "./guards.js";

export class GroupName {
  private constructor(private readonly value: string) {}

  static fromString(value: string): GroupName {
    return new GroupName(ensureNonBlank(value, "GroupName"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: GroupName): boolean {
    return this.value === other.value;
  }
}
