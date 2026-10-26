import { z } from "zod";

import { AddFlowExecutionUseCase } from "../../application/authentication/add-flow-execution.use-case.js";
import { BindRealmFlowUseCase } from "../../application/authentication/bind-realm-flow.use-case.js";
import { CopyAuthFlowUseCase } from "../../application/authentication/copy-auth-flow.use-case.js";
import { DeleteFlowExecutionUseCase } from "../../application/authentication/delete-flow-execution.use-case.js";
import { ListAuthFlowsUseCase } from "../../application/authentication/list-auth-flows.use-case.js";
import { ListAuthenticatorProvidersUseCase } from "../../application/authentication/list-authenticator-providers.use-case.js";
import { ListFlowExecutionsUseCase } from "../../application/authentication/list-flow-executions.use-case.js";
import { ListRequiredActionsUseCase } from "../../application/authentication/list-required-actions.use-case.js";
import { LowerFlowExecutionPriorityUseCase } from "../../application/authentication/lower-flow-execution-priority.use-case.js";
import { RaiseFlowExecutionPriorityUseCase } from "../../application/authentication/raise-flow-execution-priority.use-case.js";
import { SetRequiredActionEnabledUseCase } from "../../application/authentication/set-required-action-enabled.use-case.js";
import { UpdateFlowExecutionUseCase } from "../../application/authentication/update-flow-execution.use-case.js";
import type {
  AuthFlowRequirement,
  RealmFlowBinding,
} from "../../domain/authentication/authentication.js";
import type { AuthenticationRepository } from "../../domain/ports/authentication-repository.js";
import { ToolLevel } from "../../domain/policy/tool-level.js";
import type { ConfirmerFactory } from "./confirmation/confirmer-factory.js";
import { type ToolDefinition, textResult } from "./tool-definition.js";

export interface AuthToolDeps {
  readonly authenticationRepository: AuthenticationRepository;
  readonly confirmers: ConfirmerFactory;
}

const REALM_FLOW_BINDINGS = [
  "browserFlow",
  "registrationFlow",
  "directGrantFlow",
  "resetCredentialsFlow",
  "clientAuthenticationFlow",
  "dockerAuthenticationFlow",
  "firstBrokerLoginFlow",
] as const satisfies readonly RealmFlowBinding[];

const REQUIREMENTS = [
  "REQUIRED",
  "ALTERNATIVE",
  "DISABLED",
  "CONDITIONAL",
] as const satisfies readonly AuthFlowRequirement[];

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

function listFlowExecutionsTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_executions_list",
    title: "List authentication flow executions",
    description:
      "Lists the executions (steps) of one authentication flow in the currently configured Keycloak realm, identified by flow alias. Read-only and idempotent. Returns a JSON array with displayName, requirement, providerId, index, level, and whether the step is itself a sub-flow. Call keycloak_auth_flows_list first to discover aliases. Use this before copying or binding a flow so you understand its structure.",
    level: ToolLevel.Read,
    inputSchema: {
      flowAlias: z
        .string()
        .describe(
          "Alias of the authentication flow whose executions to list, exactly as returned by keycloak_auth_flows_list (for example 'browser'). Required.",
        ),
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const executions = await new ListFlowExecutionsUseCase(
        deps.authenticationRepository,
      ).execute(String(args.flowAlias));
      return textResult(JSON.stringify(executions, null, 2));
    },
  };
}

function listAuthenticatorProvidersTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_authenticator_providers_list",
    title: "List authenticator providers",
    description:
      "Lists authenticator provider ids that can be added as executions to a flow (for example auth-otp-form, webauthn-authenticator). Read-only. Use before keycloak_auth_flow_execution_add to pick a valid provider id.",
    level: ToolLevel.Read,
    inputSchema: {},
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler() {
      const providers = await new ListAuthenticatorProvidersUseCase(
        deps.authenticationRepository,
      ).execute();
      return textResult(JSON.stringify(providers, null, 2));
    },
  };
}

function copyFlowTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_copy",
    title: "Copy an authentication flow",
    description:
      "Copies an existing authentication flow to a new alias in the currently configured Keycloak realm. Built-in flows cannot be edited in place — copy them first, then customize the copy. This is a write operation that creates a new flow; it is not idempotent if the new name already exists (Keycloak returns an error). Returns a short confirmation. Prefer listing flows afterward with keycloak_auth_flows_list to verify.",
    level: ToolLevel.Write,
    inputSchema: {
      flowAlias: z
        .string()
        .describe(
          "Alias of the source authentication flow to copy (for example 'browser'). Required.",
        ),
      newName: z
        .string()
        .describe(
          "Alias for the new copied flow. Must not already exist in the realm. Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const flowAlias = String(args.flowAlias);
      const newName = String(args.newName);
      await new CopyAuthFlowUseCase(deps.authenticationRepository).execute({
        flowAlias,
        newName,
      });
      return textResult(
        `Copied authentication flow ${flowAlias} to ${newName}.`,
      );
    },
  };
}

function bindRealmFlowTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_bind",
    title: "Bind a realm authentication flow",
    description:
      "Binds an authentication flow alias to a realm-level flow slot (browser, registration, direct grant, reset credentials, client authentication, docker authentication, or first broker login). Performs a read-merge-write of the realm representation so omitted fields are not blanked. Write operation; idempotent when the binding already points at the same alias. Call keycloak_auth_flows_list first. Verify afterward with keycloak_realm_get_config or by re-listing flows and confirming the realm still authenticates as expected.",
    level: ToolLevel.Write,
    inputSchema: {
      binding: z
        .enum(REALM_FLOW_BINDINGS)
        .describe(
          "Realm flow slot to update. One of browserFlow, registrationFlow, directGrantFlow, resetCredentialsFlow, clientAuthenticationFlow, dockerAuthenticationFlow, firstBrokerLoginFlow. Required.",
        ),
      flowAlias: z
        .string()
        .describe(
          "Alias of the authentication flow to bind into that slot. Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const binding = String(args.binding) as RealmFlowBinding;
      const flowAlias = String(args.flowAlias);
      await new BindRealmFlowUseCase(deps.authenticationRepository).execute({
        binding,
        flowAlias,
      });
      return textResult(`Bound realm ${binding} to flow ${flowAlias}.`);
    },
  };
}

function addExecutionTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_execution_add",
    title: "Add an execution to an authentication flow",
    description:
      "Adds an authenticator execution to a flow (or sub-flow) by provider id. Prefer copying a built-in flow first. Use keycloak_auth_authenticator_providers_list for valid provider ids, then keycloak_auth_flow_executions_list to verify. New executions often start DISABLED or ALTERNATIVE — set requirement with keycloak_auth_flow_execution_update.",
    level: ToolLevel.Write,
    inputSchema: {
      flowAlias: z
        .string()
        .describe(
          "Alias of the flow or sub-flow to add the execution to (for example a copied 'browser-custom' or its nested forms sub-flow alias). Required.",
        ),
      providerId: z
        .string()
        .describe(
          "Authenticator provider id from keycloak_auth_authenticator_providers_list (for example 'auth-otp-form'). Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const flowAlias = String(args.flowAlias);
      const providerId = String(args.providerId);
      await new AddFlowExecutionUseCase(deps.authenticationRepository).execute({
        flowAlias,
        providerId,
      });
      return textResult(
        `Added execution ${providerId} to flow ${flowAlias}. Re-list executions to see its id and requirement.`,
      );
    },
  };
}

function updateExecutionTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_execution_update",
    title: "Update an authentication execution requirement",
    description:
      "Updates the requirement of one execution in a flow (REQUIRED, ALTERNATIVE, DISABLED, or CONDITIONAL when allowed). Reads the execution first, then PUTs the merged object. Call keycloak_auth_flow_executions_list to obtain the execution id and valid requirementChoices.",
    level: ToolLevel.Write,
    inputSchema: {
      flowAlias: z
        .string()
        .describe("Alias of the flow that owns the execution. Required."),
      executionId: z
        .string()
        .describe(
          "Execution id from keycloak_auth_flow_executions_list. Required.",
        ),
      requirement: z
        .enum(REQUIREMENTS)
        .describe(
          "New requirement. Must be one of the execution's requirementChoices when listed. Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
    },
    async handler(args) {
      const flowAlias = String(args.flowAlias);
      const executionId = String(args.executionId);
      const requirement = String(args.requirement) as AuthFlowRequirement;
      await new UpdateFlowExecutionUseCase(
        deps.authenticationRepository,
      ).execute({ flowAlias, executionId, requirement });
      return textResult(
        `Updated execution ${executionId} requirement to ${requirement}.`,
      );
    },
  };
}

function raiseExecutionPriorityTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_execution_raise_priority",
    title: "Raise authentication execution priority",
    description:
      "Moves an execution earlier in its flow (raise priority). Write operation. Re-list executions afterward to confirm order.",
    level: ToolLevel.Write,
    inputSchema: {
      executionId: z
        .string()
        .describe(
          "Execution id from keycloak_auth_flow_executions_list. Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const executionId = String(args.executionId);
      await new RaiseFlowExecutionPriorityUseCase(
        deps.authenticationRepository,
      ).execute(executionId);
      return textResult(`Raised priority for execution ${executionId}.`);
    },
  };
}

function lowerExecutionPriorityTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_execution_lower_priority",
    title: "Lower authentication execution priority",
    description:
      "Moves an execution later in its flow (lower priority). Write operation. Re-list executions afterward to confirm order.",
    level: ToolLevel.Write,
    inputSchema: {
      executionId: z
        .string()
        .describe(
          "Execution id from keycloak_auth_flow_executions_list. Required.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
    },
    async handler(args) {
      const executionId = String(args.executionId);
      await new LowerFlowExecutionPriorityUseCase(
        deps.authenticationRepository,
      ).execute(executionId);
      return textResult(`Lowered priority for execution ${executionId}.`);
    },
  };
}

function deleteExecutionTool(deps: AuthToolDeps): ToolDefinition {
  return {
    name: "keycloak_auth_flow_execution_delete",
    title: "Delete an authentication execution",
    description:
      "Permanently removes an execution from its flow. Destructive: requires confirm=true (or MCP elicitation). Can break login for clients using that flow. Prefer disabling (requirement DISABLED) when unsure.",
    level: ToolLevel.Destructive,
    inputSchema: {
      executionId: z
        .string()
        .describe(
          "Execution id from keycloak_auth_flow_executions_list. Required.",
        ),
      confirm: z
        .boolean()
        .optional()
        .describe(
          "Must be true to proceed when the client does not support elicitation.",
        ),
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
    },
    async handler(args) {
      const executionId = String(args.executionId);
      const confirmer = deps.confirmers.create(args.confirm === true);
      const result = await new DeleteFlowExecutionUseCase(
        deps.authenticationRepository,
        confirmer,
      ).execute(executionId);
      return textResult(
        result.deleted
          ? `Deleted authentication execution ${executionId}.`
          : `Not deleted: ${result.reason ?? "unknown reason"}`,
      );
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
    listFlowExecutionsTool(deps),
    listAuthenticatorProvidersTool(deps),
    copyFlowTool(deps),
    bindRealmFlowTool(deps),
    addExecutionTool(deps),
    updateExecutionTool(deps),
    raiseExecutionPriorityTool(deps),
    lowerExecutionPriorityTool(deps),
    deleteExecutionTool(deps),
    listRequiredActionsTool(deps),
    setRequiredActionEnabledTool(deps),
  ];
}
