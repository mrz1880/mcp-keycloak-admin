import { Email } from "../shared/email.js";
import { UserId } from "../shared/user-id.js";
import { Username } from "../shared/username.js";

/** Read model of a Keycloak user, expressed entirely in value objects. */
export interface User {
  readonly id: UserId;
  readonly username: Username;
  readonly email: Email | null;
  readonly enabled: boolean;
}
