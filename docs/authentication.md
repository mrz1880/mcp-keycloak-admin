# Authentication tools

Tools for authentication flows and required actions. Built-in flows cannot be
edited in place — copy them first, customize executions on the copy, then bind
the copy to a realm flow slot.

## `keycloak_auth_flows_list` [R]

List the realm's authentication flows. No parameters. Returns `id`, `alias`,
`builtIn` (and optional `description` / `topLevel`).

## `keycloak_auth_flow_executions_list` [R]

List executions (steps) for one flow.

| Parameter   | Type   | Required | Description        |
| ----------- | ------ | -------- | ------------------ |
| `flowAlias` | string | yes      | Source flow alias. |

## `keycloak_auth_authenticator_providers_list` [R]

List authenticator provider ids that can be added as executions. No parameters.

## `keycloak_auth_flow_copy` [W]

Copy a flow to a new alias (`POST .../authentication/flows/{alias}/copy`).

| Parameter   | Type   | Required | Description             |
| ----------- | ------ | -------- | ----------------------- |
| `flowAlias` | string | yes      | Source flow alias.      |
| `newName`   | string | yes      | Alias for the new flow. |

## `keycloak_auth_flow_bind` [W]

Bind a flow alias to a realm flow slot via read-merge-write of the realm
representation (avoids blanking omitted fields).

| Parameter   | Type   | Required | Description                                                                                                                                                          |
| ----------- | ------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `binding`   | enum   | yes      | One of `browserFlow`, `registrationFlow`, `directGrantFlow`, `resetCredentialsFlow`, `clientAuthenticationFlow`, `dockerAuthenticationFlow`, `firstBrokerLoginFlow`. |
| `flowAlias` | string | yes      | Flow alias to bind.                                                                                                                                                  |

## `keycloak_auth_flow_execution_add` [W]

Add an authenticator to a flow or sub-flow.

| Parameter    | Type   | Required | Description                                        |
| ------------ | ------ | -------- | -------------------------------------------------- |
| `flowAlias`  | string | yes      | Flow or nested sub-flow alias.                     |
| `providerId` | string | yes      | From `keycloak_auth_authenticator_providers_list`. |

## `keycloak_auth_flow_execution_update` [W]

Set an execution's requirement (`REQUIRED` / `ALTERNATIVE` / `DISABLED` /
`CONDITIONAL` when allowed).

| Parameter     | Type   | Required | Description                                      |
| ------------- | ------ | -------- | ------------------------------------------------ |
| `flowAlias`   | string | yes      | Flow that owns the execution.                    |
| `executionId` | string | yes      | From `keycloak_auth_flow_executions_list`.       |
| `requirement` | enum   | yes      | New requirement (must be in requirementChoices). |

## `keycloak_auth_flow_execution_raise_priority` / `_lower_priority` [W]

Reorder an execution within its flow.

| Parameter     | Type   | Required | Description                                |
| ------------- | ------ | -------- | ------------------------------------------ |
| `executionId` | string | yes      | From `keycloak_auth_flow_executions_list`. |

## `keycloak_auth_flow_execution_delete` [D]

Delete an execution. Requires confirmation (`confirm: true` or elicitation).

| Parameter     | Type    | Required | Description                                |
| ------------- | ------- | -------- | ------------------------------------------ |
| `executionId` | string  | yes      | From `keycloak_auth_flow_executions_list`. |
| `confirm`     | boolean | no       | Must be `true` without elicitation.        |

## `keycloak_auth_required_actions_list` [R]

List the realm's required actions. No parameters. Returns `alias`, `name`,
`enabled`, `defaultAction`.

## `keycloak_auth_required_action_set_enabled` [W]

Enable or disable a required action by alias.

| Parameter | Type    | Required | Description                           |
| --------- | ------- | -------- | ------------------------------------- |
| `alias`   | string  | yes      | The required action alias.            |
| `enabled` | boolean | yes      | Whether the action should be enabled. |
