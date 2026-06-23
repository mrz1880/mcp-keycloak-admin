import { ensureNonBlank } from "./guards.js";

/** The human-readable `clientId` of a Keycloak client (e.g. "mcp-admin"). */
export class ClientId {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ClientId {
    return new ClientId(ensureNonBlank(value, "ClientId"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientId): boolean {
    return this.value === other.value;
  }
}
