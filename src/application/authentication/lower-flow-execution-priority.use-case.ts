import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class LowerFlowExecutionPriorityUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(executionId: string): Promise<void> {
    return this.authentication.lowerExecutionPriority(executionId);
  }
}
