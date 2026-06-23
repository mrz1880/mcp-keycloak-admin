import { ensureNonBlank } from "./guards.js";

export class RoleName {
  private constructor(private readonly value: string) {}

  static fromString(value: string): RoleName {
    return new RoleName(ensureNonBlank(value, "RoleName"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: RoleName): boolean {
    return this.value === other.value;
  }
}
