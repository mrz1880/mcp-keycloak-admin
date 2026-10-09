import type { RealmFlowBinding } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class BindRealmFlowUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(input: {
    binding: RealmFlowBinding;
    flowAlias: string;
  }): Promise<void> {
    return this.authentication.bindRealmFlow(input.binding, input.flowAlias);
  }
}
