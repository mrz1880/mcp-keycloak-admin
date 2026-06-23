import { ensureNonBlank } from "./guards.js";

export class Username {
  private constructor(private readonly value: string) {}

  static fromString(value: string): Username {
    const trimmed = ensureNonBlank(value, "Username");
    if (/\s/.test(trimmed)) {
      throw new Error("Username cannot contain whitespace");
    }
    return new Username(trimmed);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Username): boolean {
    return this.value === other.value;
  }
}
