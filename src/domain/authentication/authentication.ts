export interface AuthFlow {
  readonly id: string;
  readonly alias: string;
  readonly builtIn: boolean;
  readonly description?: string;
  readonly topLevel?: boolean;
}

export interface AuthFlowExecution {
  readonly id: string;
  readonly displayName: string;
  readonly requirement: string;
  readonly index: number;
  readonly level: number;
  readonly providerId: string;
  readonly authenticationFlow: boolean;
  readonly configurable: boolean;
  readonly flowId?: string;
  readonly requirementChoices?: readonly string[];
}

export type AuthFlowRequirement =
  "REQUIRED" | "ALTERNATIVE" | "DISABLED" | "CONDITIONAL";

export type RealmFlowBinding =
  | "browserFlow"
  | "registrationFlow"
  | "directGrantFlow"
  | "resetCredentialsFlow"
  | "clientAuthenticationFlow"
  | "dockerAuthenticationFlow"
  | "firstBrokerLoginFlow";

export interface AuthenticatorProvider {
  readonly id: string;
  readonly displayName: string;
  readonly description: string;
}

export interface RequiredAction {
  readonly alias: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly defaultAction: boolean;
}
