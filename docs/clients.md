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

## `keycloak_client_create` [W]

Create a realm client.

| Parameter      | Type     | Required | Description                   |
| -------------- | -------- | -------- | ----------------------------- |
| `clientId`     | string   | yes      | The human-readable client id. |
| `enabled`      | boolean  | no       | Defaults to `true`.           |
| `publicClient` | boolean  | no       | `true` for a public client.   |
| `redirectUris` | string[] | no       | Allowed redirect URIs.        |
| `webOrigins`   | string[] | no       | Allowed CORS web origins.     |

## `keycloak_client_update` [W]

Update a client's `enabled`, `publicClient`, `redirectUris` or `webOrigins`
(only the supplied fields change).

| Parameter      | Type     | Required | Description      |
| -------------- | -------- | -------- | ---------------- |
| `clientId`     | string   | yes      | The client's id. |
| `enabled`      | boolean  | no       |                  |
| `publicClient` | boolean  | no       |                  |
| `redirectUris` | string[] | no       |                  |
| `webOrigins`   | string[] | no       |                  |

## `keycloak_client_delete` [D]

Delete a client. **Destructive** — requires confirmation. Removes the client and
everything attached to it; applications using it stop working.

| Parameter  | Type    | Required | Description                    |
| ---------- | ------- | -------- | ------------------------------ |
| `clientId` | string  | yes      | The client's id.               |
| `confirm`  | boolean | no       | Elicitation fallback approval. |
