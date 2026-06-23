import type { Email } from "../shared/email.js";
import type { Username } from "../shared/username.js";

export interface NewUser {
  readonly username: Username;
  readonly email?: Email;
  readonly enabled: boolean;
  readonly emailVerified: boolean;
}
