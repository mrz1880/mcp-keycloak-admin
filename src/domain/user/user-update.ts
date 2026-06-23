import type { Email } from "../shared/email.js";

export interface UserUpdate {
  readonly email?: Email;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly enabled?: boolean;
}
