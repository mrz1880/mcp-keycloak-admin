export interface AuthFlow {
  readonly id: string;
  readonly alias: string;
  readonly builtIn: boolean;
}

export interface RequiredAction {
  readonly alias: string;
  readonly name: string;
  readonly enabled: boolean;
  readonly defaultAction: boolean;
}
