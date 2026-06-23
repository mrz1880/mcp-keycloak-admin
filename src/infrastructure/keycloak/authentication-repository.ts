import type {
  AuthFlow,
  RequiredAction,
} from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakFlow {
  readonly id?: string;
  readonly alias?: string;
  readonly builtIn?: boolean;
}

interface KeycloakRequiredAction {
  readonly alias?: string;
  readonly name?: string;
  readonly enabled?: boolean;
  readonly defaultAction?: boolean;
}

export class KeycloakAuthenticationRepository implements AuthenticationRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async listFlows(): Promise<AuthFlow[]> {
    const raw = await this.client.getJson<KeycloakFlow[]>(
      "/authentication/flows",
    );
    return raw.map((flow) => ({
      id: flow.id ?? "",
      alias: flow.alias ?? "",
      builtIn: flow.builtIn ?? false,
    }));
  }

  async listRequiredActions(): Promise<RequiredAction[]> {
    const raw = await this.client.getJson<KeycloakRequiredAction[]>(
      "/authentication/required-actions",
    );
    return raw.map((action) => ({
      alias: action.alias ?? "",
      name: action.name ?? "",
      enabled: action.enabled ?? false,
      defaultAction: action.defaultAction ?? false,
    }));
  }

  async setRequiredActionEnabled(
    alias: string,
    enabled: boolean,
  ): Promise<void> {
    const current = await this.client.getJson<Record<string, unknown>>(
      `/authentication/required-actions/${encodeURIComponent(alias)}`,
    );
    await this.client.put(
      `/authentication/required-actions/${encodeURIComponent(alias)}`,
      { ...current, enabled },
    );
  }
}
