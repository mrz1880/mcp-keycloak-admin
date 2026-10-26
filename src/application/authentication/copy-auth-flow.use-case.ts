import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class CopyAuthFlowUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: { flowAlias: string; newName: string }): Promise<void> {
    return this.authentication.copyFlow(input.flowAlias, input.newName);
  }
}
