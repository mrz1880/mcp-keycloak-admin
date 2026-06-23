import { ensureNonBlank } from "./guards.js";

export class ClientSecret {
  private constructor(private readonly value: string) {}

  static fromString(value: string): ClientSecret {
    return new ClientSecret(ensureNonBlank(value, "ClientSecret"));
  }

  /** Reveals the raw secret. Only call when the caller explicitly opted in. */
  reveal(): string {
    return this.value;
  }

  /** A safe representation that never exposes the secret. */
  masked(): string {
    return "••••••••";
  }

  toString(): string {
    return this.masked();
  }
}
