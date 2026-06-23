import type { AuthFlow } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class ListAuthFlowsUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(): Promise<AuthFlow[]> {
    return this.authentication.listFlows();
  }
}
