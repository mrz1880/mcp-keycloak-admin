import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class AddFlowExecutionUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: { flowAlias: string; providerId: string }): Promise<void> {
    return this.authentication.addExecution(input.flowAlias, input.providerId);
  }
}
