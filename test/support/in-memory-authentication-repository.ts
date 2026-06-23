import type {
  AuthFlow,
  RequiredAction,
} from "../../src/domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../src/domain/ports/authentication-repository.js";

export class InMemoryAuthenticationRepository implements AuthenticationRepository {
  readonly toggled: { alias: string; enabled: boolean }[] = [];
  private readonly flows: AuthFlow[];
  private readonly actions: RequiredAction[];

  constructor(flows: AuthFlow[] = [], actions: RequiredAction[] = []) {
    this.flows = flows;
    this.actions = actions;
  }

  listFlows(): Promise<AuthFlow[]> {
    return Promise.resolve(this.flows);
  }

  listRequiredActions(): Promise<RequiredAction[]> {
    return Promise.resolve(this.actions);
  }

  setRequiredActionEnabled(alias: string, enabled: boolean): Promise<void> {
    this.toggled.push({ alias, enabled });
    return Promise.resolve();
  }
}
