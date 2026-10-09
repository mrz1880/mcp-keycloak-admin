import type { AuthFlowExecution } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class ListFlowExecutionsUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(flowAlias: string): Promise<AuthFlowExecution[]> {
    return this.authentication.listFlowExecutions(flowAlias);
  }
}
