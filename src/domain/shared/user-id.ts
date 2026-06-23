import { ensureUuid } from "./guards.js";

export class UserId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): UserId {
    return new UserId(ensureUuid(value, "UserId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: UserId): boolean {
    return this.value === other.value;
  }
}
