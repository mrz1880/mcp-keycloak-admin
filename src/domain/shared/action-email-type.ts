const ACTIONS = [
  "VERIFY_EMAIL",
  "UPDATE_PASSWORD",
  "UPDATE_PROFILE",
  "CONFIGURE_TOTP",
] as const;

export type ActionEmailValue = (typeof ACTIONS)[number];

export class ActionEmailType {
  private constructor(private readonly value: ActionEmailValue) {}

  static fromString(value: string): ActionEmailType {
    const match = ACTIONS.find((action) => action === value);
    if (match === undefined) {
      throw new Error(`Unknown action email type: ${value}`);
    }
    return new ActionEmailType(match);
  }

  toString(): string {
    return this.value;
  }
}
