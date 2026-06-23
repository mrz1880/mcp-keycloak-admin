import { ensureNonBlank } from "./guards.js";

export class Password {
  private constructor(private readonly value: string) {}

  static fromString(value: string): Password {
    return new Password(ensureNonBlank(value, "Password"));
  }

  reveal(): string {
    return this.value;
  }

  /** Prevents accidental leakage through logging / serialization. */
  toString(): string {
    return "[redacted]";
  }

  toJSON(): string {
    return "[redacted]";
  }
}
