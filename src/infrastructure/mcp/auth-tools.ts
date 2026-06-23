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
    description: "List the realm's authentication flows.",
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
    description: "List the realm's required actions.",
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
    description: "Enable or disable a realm required action by alias.",
    level: ToolLevel.Write,
    inputSchema: { alias: z.string(), enabled: z.boolean() },
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
