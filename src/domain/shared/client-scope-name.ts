import { ensureNonBlank } from "./guards.js";

export class ClientScopeName {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ClientScopeName {
    return new ClientScopeName(ensureNonBlank(value, "ClientScopeName"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientScopeName): boolean {
    return this.value === other.value;
  }
}
