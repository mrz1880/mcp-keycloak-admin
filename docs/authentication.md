# Authentication tools

Read-first tools for authentication flows and required actions. Full flow
mutation (copying flows, adding executions) is intentionally out of scope.

## `keycloak_auth_flows_list` [R]

List the realm's authentication flows. No parameters. Returns `id`, `alias`,
`builtIn`.

## `keycloak_auth_required_actions_list` [R]

List the realm's required actions. No parameters. Returns `alias`, `name`,
`enabled`, `defaultAction`.

## `keycloak_auth_required_action_set_enabled` [W]

Enable or disable a required action by alias.

| Parameter | Type    | Required | Description                           |
| --------- | ------- | -------- | ------------------------------------- |
| `alias`   | string  | yes      | The required action alias.            |
| `enabled` | boolean | yes      | Whether the action should be enabled. |
