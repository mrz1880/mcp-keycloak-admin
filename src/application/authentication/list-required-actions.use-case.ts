import type { RequiredAction } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class ListRequiredActionsUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(): Promise<RequiredAction[]> {
    return this.authentication.listRequiredActions();
  }
}
