import { ensureNonBlank } from "./guards.js";

export class IdpAlias {
  private constructor(private readonly value: string) {}

  static fromString(value: string): IdpAlias {
    return new IdpAlias(ensureNonBlank(value, "IdpAlias"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: IdpAlias): boolean {
    return this.value === other.value;
  }
}
