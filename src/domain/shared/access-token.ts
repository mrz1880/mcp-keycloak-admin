import { ensureNonBlank } from "./guards.js";

export class AccessToken {
  private constructor(
    private readonly value: string,
    private readonly expiresAt: number,
  ) {}

  /**
   * @param value the raw bearer token
   * @param expiresAt absolute expiry, epoch milliseconds
   */
  static issue(value: string, expiresAt: number): AccessToken {
    return new AccessToken(ensureNonBlank(value, "AccessToken"), expiresAt);
  }

  toString(): string {
    return this.value;
  }

  isExpiringWithin(thresholdMs: number, now: number): boolean {
    return this.expiresAt - now <= thresholdMs;
  }
}
