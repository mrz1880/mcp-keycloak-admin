# User federation tools

User federation providers (LDAP, Active Directory, Kerberos) are modelled by
Keycloak as storage-provider components.

## `keycloak_federation_list` [R]

List the realm's user federation providers. No parameters. Returns `id`, `name`,
`providerId`.

## `keycloak_federation_get` [R]

Fetch a federation provider by id.

| Parameter | Type   | Required | Description              |
| --------- | ------ | -------- | ------------------------ |
| `id`      | string | yes      | The component id (UUID). |

## `keycloak_federation_sync` [W]

Trigger a user synchronization from the provider. Returns the sync result
(`status`, `added`, `updated`, `removed`).

| Parameter | Type   | Required | Description                              |
| --------- | ------ | -------- | ---------------------------------------- |
| `id`      | string | yes      | The component id (UUID).                 |
| `mode`    | string | no       | `full` or `changed` (default `changed`). |

> Connection testing and provider CRUD beyond sync are intentionally out of
> scope for now, as they carry a high blast radius.
