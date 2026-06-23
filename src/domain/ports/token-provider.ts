import { AccessToken } from "../shared/access-token.js";

export interface TokenProvider {
  getToken(): Promise<AccessToken>;
}
