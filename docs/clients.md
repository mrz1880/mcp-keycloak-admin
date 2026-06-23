# Client tools

## `keycloak_client_list` [R]

List the realm clients. No parameters. Returns `uuid`, `clientId`, `enabled`,
`publicClient`.

## `keycloak_client_get` [R]

Fetch a client by its human-readable `clientId`.

| Parameter  | Type   | Required | Description      |
| ---------- | ------ | -------- | ---------------- |
| `clientId` | string | yes      | The client's id. |

## `keycloak_client_get_secret` [R]

Read a confidential client's secret. **Masked by default** — pass `reveal: true`
to return the raw value.

| Parameter  | Type    | Required | Description                            |
| ---------- | ------- | -------- | -------------------------------------- |
| `clientId` | string  | yes      | The client's id.                       |
| `reveal`   | boolean | no       | Return the raw secret instead of `••`. |

## `keycloak_client_regenerate_secret` [D]

Regenerate a confidential client's secret. **Destructive** — requires
confirmation. Any service still using the old secret will fail to authenticate
until updated. The new secret is returned on success.

| Parameter  | Type    | Required | Description                    |
| ---------- | ------- | -------- | ------------------------------ |
| `clientId` | string  | yes      | The client's id.               |
| `confirm`  | boolean | no       | Elicitation fallback approval. |
