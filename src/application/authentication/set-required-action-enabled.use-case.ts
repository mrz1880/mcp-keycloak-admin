import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export interface SetRequiredActionEnabledInput {
  readonly alias: string;
  readonly enabled: boolean;
}

export class SetRequiredActionEnabledUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: SetRequiredActionEnabledInput): Promise<void> {
    return this.authentication.setRequiredActionEnabled(
      input.alias,
      input.enabled,
    );
  }
}
