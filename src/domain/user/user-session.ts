export interface UserSession {
  readonly id: string;
  readonly ipAddress: string | null;
  readonly start: number;
  readonly lastAccess: number;
}
