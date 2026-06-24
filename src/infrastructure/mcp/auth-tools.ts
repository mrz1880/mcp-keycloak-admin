import { z } from "zod";

import { ListAuthFlowsUseCase } from "../../application/authentication/list-auth-flows.use-case.js";
import { ListRequiredActionsUseCase } from "../../application/authentication/list-required-actions.use-case.js";
import { SetRequiredActionEnabledUseCase } from "../../application/authentication/set-required-action-enabled.use-case.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface AuthToolDeps {
  readonly authenticationRepository: AuthenticationRepository;
}

function listFlowsTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flows_list",
    title: "List authentication flows",
    description:
      "Lists every authentication flow defined in the currently configured Keycloak realm. This is a read-only, idempotent operation that takes no parameters and does not modify any data. Returns a JSON array of flow objects (including alias, description, provider id, top-level and built-in indicators) as formatted text. Use it to inspect or audit the realm's login, registration, and reset-credential flows before configuring related authentication settings.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const flows = await new ListAuthFlowsUseCase(
        deps.authenticationRepository,
      ).execute();
      return textResult(JSON.stringify(flows, null, 2));
    },
  };
}

function listRequiredActionsTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_required_actions_list",
    title: "List required actions",
    description:
      "Lists every required action configured in the currently configured Keycloak realm (for example Verify Email, Update Password, or Configure OTP). This is a read-only, idempotent operation that takes no parameters and does not change any data. Returns a JSON array of required-action objects (including alias, name, enabled, defaultAction, and priority) as formatted text. Use it to discover available aliases before enabling or disabling a required action with keycloak_auth_required_action_set_enabled.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const actions = await new ListRequiredActionsUseCase(
        deps.authenticationRepository,
      ).execute();
      return textResult(JSON.stringify(actions, null, 2));
    },
  };
}

function setRequiredActionEnabledTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_required_action_set_enabled",
    title: "Enable or disable a required action",
    description:
      "Enables or disables a single required action in the currently configured Keycloak realm, identified by its alias. This is a write operation that is not destructive and is idempotent: setting an already-matching state leaves the action unchanged. Call keycloak_auth_required_actions_list first to obtain valid aliases. Returns a short text confirmation stating whether the action was enabled or disabled.",
    level: ToolLevel.Write,
    inputSchema: {
      alias: z
        .string()
        .describe(
          "Alias identifying the required action to update, exactly as returned by keycloak_auth_required_actions_list (for example 'VERIFY_EMAIL' or 'UPDATE_PASSWORD'). Required.",
        ),
      enabled: z
        .boolean()
        .describe(
          "Target state for the required action: true enables it, false disables it. Required; the operation is idempotent when the action is already in the requested state.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const enabled = args.enabled === true;
      await new SetRequiredActionEnabledUseCase(
        deps.authenticationRepository,
      ).execute({ alias: String(args.alias), enabled });
      return textResult(
        `Required action ${String(args.alias)} ${
          enabled ? "enabled" : "disabled"
        }.`,
      );
    },
  };
}

export function buildAuthTools(deps: AuthToolDeps): ToolDefinition[] {
  return [
    listFlowsTool(deps),
    listRequiredActionsTool(deps),
    setRequiredActionEnabledTool(deps),
  ];
}
