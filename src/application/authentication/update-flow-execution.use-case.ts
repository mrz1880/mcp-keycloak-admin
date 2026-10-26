import type { AuthFlowRequirement } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class UpdateFlowExecutionUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: {
    flowAlias: string;
    executionId: string;
    requirement: AuthFlowRequirement;
  }): Promise<void> {
    return this.authentication.updateExecutionRequirement(
      input.flowAlias,
      input.executionId,
      input.requirement,
    );
  }
}
