export interface LoginEvent {
  readonly time: number;
  readonly type: string;
  readonly userId: string | null;
  readonly ipAddress: string | null;
}

export interface AdminEvent {
  readonly time: number;
  readonly operationType: string;
  readonly resourceType: string;
  readonly resourcePath: string | null;
}

export interface EventQuery {
  readonly max: number;
  readonly type?: string;
  readonly user?: string;
}
