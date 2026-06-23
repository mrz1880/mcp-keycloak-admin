import type {
  AuthFlow,
  RequiredAction,
} from "../authentication/authentication.js";

export interface AuthenticationRepository {
  listFlows(): Promise<AuthFlow[]>;
  listRequiredActions(): Promise<RequiredAction[]>;
  setRequiredActionEnabled(alias: string, enabled: boolean): Promise<void>;
}
