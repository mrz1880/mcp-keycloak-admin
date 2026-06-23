import { ensureUuid } from "./guards.js";

export class GroupId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): GroupId {
    return new GroupId(ensureUuid(value, "GroupId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: GroupId): boolean {
    return this.value === other.value;
  }
}
