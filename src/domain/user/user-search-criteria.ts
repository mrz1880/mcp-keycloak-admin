import { Email } from "../shared/email.js";
import { Username } from "../shared/username.js";

export interface UserSearchCriteria {
  readonly email?: Email;
  readonly username?: Username;
  readonly search?: string;
  readonly first: number;
  readonly max: number;
}
