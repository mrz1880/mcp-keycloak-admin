import { ensureUuid } from "./guards.js";

export class ClientScopeId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ClientScopeId {
    return new ClientScopeId(ensureUuid(value, "ClientScopeId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientScopeId): boolean {
    return this.value === other.value;
  }
}
