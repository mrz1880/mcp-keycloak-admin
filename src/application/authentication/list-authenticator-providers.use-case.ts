import type { AuthenticatorProvider } from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";

export class ListAuthenticatorProvidersUseCase {
  constructor(private readonly authentication: AuthenticationRepository) {}

  execute(): Promise<AuthenticatorProvider[]> {
    return this.authentication.listAuthenticatorProviders();
  }
}
