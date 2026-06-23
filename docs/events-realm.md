# Events & realm tools

All read-only.

## `keycloak_events_login` [R]

Read recent login events.

| Parameter | Type    | Required | Description                            |
| --------- | ------- | -------- | -------------------------------------- |
| `max`     | integer | no       | Number of events (default `20`, ≤500). |
| `type`    | string  | no       | Filter by event type (e.g. `LOGIN`).   |
| `user`    | string  | no       | Filter by user id.                     |

Returns `time`, `type`, `userId`, `ipAddress`.

## `keycloak_events_admin` [R]

Read recent admin events.

| Parameter | Type    | Required | Description                            |
| --------- | ------- | -------- | -------------------------------------- |
| `max`     | integer | no       | Number of events (default `20`, ≤500). |

Returns `time`, `operationType`, `resourceType`, `resourcePath`.

## `keycloak_realm_get_config` [R]

Read a curated set of realm configuration flags (registration, password reset,
email verification, brute-force protection, token lifespans, …). No parameters.

## `keycloak_server_info` [R]

Read the Keycloak server version. No parameters.
