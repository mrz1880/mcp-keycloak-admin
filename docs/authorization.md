# Authorization services tools

Read-only views over a client's authorization services (only meaningful for
clients that have authorization enabled). Policy/permission evaluation and CRUD
are intentionally out of scope for now.

Each tool takes the client's human-readable `clientId` and resolves it to the
internal id.

## `keycloak_authz_resources_list` [R]

List a client's authorization resources (`id`, `name`, `type`).

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |

## `keycloak_authz_policies_list` [R]

List a client's authorization policies.

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |

## `keycloak_authz_permissions_list` [R]

List a client's authorization permissions.

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |
