import { ensureUuid } from "./guards.js";

/** The internal UUID Keycloak assigns to a client (distinct from its clientId). */
export class ClientUuid {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ClientUuid {
    return new ClientUuid(ensureUuid(value, "ClientUuid"));
  }

  toString(): string {
    return this.value;
  }

  equals(other: ClientUuid): boolean {
    return this.value === other.value;
  }
}
