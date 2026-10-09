import type {
  AuthFlow,
  AuthFlowExecution,
  AuthFlowRequirement,
  AuthenticatorProvider,
  RealmFlowBinding,
  RequiredAction,
} from "../authentication/authentication.js";

export interface AuthenticationRepository {
  listFlows(): Promise<AuthFlow[]>;
  listFlowExecutions(flowAlias: string): Promise<AuthFlowExecution[]>;
  listAuthenticatorProviders(): Promise<AuthenticatorProvider[]>;
  copyFlow(flowAlias: string, newName: string): Promise<void>;
  bindRealmFlow(binding: RealmFlowBinding, flowAlias: string): Promise<void>;
  addExecution(flowAlias: string, providerId: string): Promise<void>;
  updateExecutionRequirement(
    flowAlias: string,
    executionId: string,
    requirement: AuthFlowRequirement,
  ): Promise<void>;
  raiseExecutionPriority(executionId: string): Promise<void>;
  lowerExecutionPriority(executionId: string): Promise<void>;
  deleteExecution(executionId: string): Promise<void>;
  listRequiredActions(): Promise<RequiredAction[]>;
  setRequiredActionEnabled(alias: string, enabled: boolean): Promise<void>;
}
