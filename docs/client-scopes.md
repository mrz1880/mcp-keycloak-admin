# Client scope & mapper tools

## `keycloak_client_scopes_list` [R]

List the realm's client scopes. No parameters. Returns `id`, `name`, `protocol`.

## `keycloak_client_default_scopes_get` [R]

List the default client scopes assigned to a client.

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |

## `keycloak_client_mappers_list` [R]

List a client's protocol mappers (`id`, `name`, `protocol`, `type`).

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |

## `keycloak_client_scope_assign` [W]

Add a default client scope to a client. Both the client and the scope are
resolved by name.

| Parameter  | Type   | Required | Description            |
| ---------- | ------ | -------- | ---------------------- |
| `clientId` | string | yes      | The client's id.       |
| `scope`    | string | yes      | The client scope name. |

## `keycloak_client_scope_unassign` [D]

Remove a default client scope from a client. **Destructive** — requires
confirmation. The client stops emitting the claims and roles the scope adds.

| Parameter  | Type    | Required | Description                    |
| ---------- | ------- | -------- | ------------------------------ |
| `clientId` | string  | yes      | The client's id.               |
| `scope`    | string  | yes      | The client scope name.         |
| `confirm`  | boolean | no       | Elicitation fallback approval. |
