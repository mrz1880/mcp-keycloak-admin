# mcp-keycloak-admin

[![npm version](https://img.shields.io/npm/v/mcp-keycloak-admin.svg)](https://www.npmjs.com/package/mcp-keycloak-admin)
[![CI](https://github.com/mrz1880/mcp-keycloak-admin/actions/workflows/ci.yml/badge.svg)](https://github.com/mrz1880/mcp-keycloak-admin/actions/workflows/ci.yml)
[![CodeQL](https://github.com/mrz1880/mcp-keycloak-admin/actions/workflows/codeql.yml/badge.svg)](https://github.com/mrz1880/mcp-keycloak-admin/actions/workflows/codeql.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server to
administer a [Keycloak](https://www.keycloak.org) instance through its Admin
REST API. Safe by default, configurable, and built with a clean, test-driven
architecture.

Compatible with **Keycloak 26.x** (validated against 26.0.5).

## Install

No install needed — run it straight from npm with `npx`:

```bash
npx -y mcp-keycloak-admin
```

The server speaks MCP over stdio, so you normally wire it into an MCP client
rather than running it by hand — see [Usage with an MCP client](#usage-with-an-mcp-client).

## Why

Administering Keycloak from an MCP client (an assistant, an IDE, a custom agent)
means exposing day-to-day operations — searching users, managing roles, reading
events — as MCP tools, without handing over a raw admin console. This server
does that with strong guardrails so destructive actions never happen silently.

## Features

- **Two authentication modes**, selectable by configuration:
  - `service_account` — a confidential client with a service account
    (recommended; no admin password stored).
  - `password` — the `admin-cli` client with an admin username/password.
- **Safe by default:**
  - `READ_ONLY` mode hides every write/destructive tool.
  - `ALLOWED_REALMS` restricts which realms the server may operate on.
  - Destructive operations require explicit confirmation (native MCP
    elicitation, with a `confirm: true` parameter fallback for clients that do
    not support elicitation).
- **Clean Architecture**: a framework-free domain, application use cases, and
  infrastructure adapters. No business concept travels as a raw string or
  number — every one is a validated value object.

## Requirements

- Node.js >= 20
- A reachable Keycloak 26.x server

## Usage with an MCP client

Add the server to your MCP client configuration:

```json
{
  "mcpServers": {
    "keycloak-admin": {
      "command": "npx",
      "args": ["-y", "mcp-keycloak-admin"],
      "env": {
        "KEYCLOAK_BASE_URL": "http://localhost:8080",
        "KEYCLOAK_REALM": "demo-realm",
        "AUTH_MODE": "service_account",
        "KC_CLIENT_ID": "mcp-admin",
        "KC_CLIENT_SECRET": "your-secret"
      }
    }
  }
}
```

See [docs/setup-keycloak.md](docs/setup-keycloak.md) to create the `mcp-admin`
client and grant it the least-privilege roles it needs.

## Configuration

| Variable            | Required              | Description                                              |
| ------------------- | --------------------- | -------------------------------------------------------- |
| `KEYCLOAK_BASE_URL` | yes                   | Base URL of the Keycloak server (no trailing slash).     |
| `KEYCLOAK_REALM`    | yes                   | Realm the server operates on.                            |
| `AUTH_MODE`         | yes                   | `service_account` or `password`.                         |
| `KC_CLIENT_ID`      | if `service_account`  | Confidential client id (e.g. `mcp-admin`).               |
| `KC_CLIENT_SECRET`  | if `service_account`  | Client secret.                                           |
| `KC_ADMIN_USERNAME` | if `password`         | Admin username.                                          |
| `KC_ADMIN_PASSWORD` | if `password`         | Admin password.                                          |
| `KC_ADMIN_REALM`    | no (default `master`) | Realm holding the admin user (`password` mode).          |
| `READ_ONLY`         | no (default `false`)  | When `true`, write/destructive tools are not registered. |
| `ALLOWED_REALMS`    | no                    | Comma-separated allow-list of realms. Empty = all.       |

A full example lives in [`.env.example`](.env.example).

## Tools

Levels: **[R]** read-only · **[W]** write · **[D]** destructive (requires
confirmation). Every tool carries the matching MCP annotations
(`readOnlyHint` / `destructiveHint` / `idempotentHint`).

Currently implemented:

| Tool                                        | Level | Description                                           |
| ------------------------------------------- | ----- | ----------------------------------------------------- |
| `keycloak_user_search`                      | R     | Search realm users by email, username or free text.   |
| `keycloak_user_get`                         | R     | Fetch a single user by id.                            |
| `keycloak_user_sessions_list`               | R     | List a user's active sessions.                        |
| `keycloak_user_create`                      | W     | Create a realm user.                                  |
| `keycloak_user_update`                      | W     | Update a user's email, name or enabled flag.          |
| `keycloak_user_set_enabled`                 | W     | Enable or disable a user.                             |
| `keycloak_user_send_action_email`           | W     | Send a required-actions email.                        |
| `keycloak_user_reset_password`              | D     | Set a new password for a user.                        |
| `keycloak_user_logout`                      | D     | Revoke all of a user's sessions.                      |
| `keycloak_user_delete`                      | D     | Permanently delete a user (id + username must match). |
| `keycloak_role_list`                        | R     | List realm roles.                                     |
| `keycloak_user_roles_get`                   | R     | List a user's realm roles.                            |
| `keycloak_user_role_assign`                 | W     | Grant a realm role to a user.                         |
| `keycloak_user_role_unassign`               | D     | Revoke a realm role from a user.                      |
| `keycloak_client_list`                      | R     | List the realm clients.                               |
| `keycloak_client_get`                       | R     | Fetch a client by its clientId.                       |
| `keycloak_client_get_secret`                | R     | Read a client secret (masked unless `reveal`).        |
| `keycloak_client_scopes_list`               | R     | List the realm's client scopes.                       |
| `keycloak_client_default_scopes_get`        | R     | List a client's default scopes.                       |
| `keycloak_client_mappers_list`              | R     | List a client's protocol mappers.                     |
| `keycloak_client_scope_assign`              | W     | Add a default scope to a client.                      |
| `keycloak_client_scope_unassign`            | D     | Remove a default scope from a client.                 |
| `keycloak_client_regenerate_secret`         | D     | Regenerate a client secret (old one stops working).   |
| `keycloak_group_list`                       | R     | List the realm's top-level groups.                    |
| `keycloak_group_members_list`               | R     | List the members of a group.                          |
| `keycloak_user_groups_list`                 | R     | List the groups a user belongs to.                    |
| `keycloak_group_create`                     | W     | Create a top-level group.                             |
| `keycloak_group_member_add`                 | W     | Add a user to a group.                                |
| `keycloak_group_role_assign`                | W     | Grant a realm role to a group.                        |
| `keycloak_group_member_remove`              | D     | Remove a user from a group.                           |
| `keycloak_group_delete`                     | D     | Delete a group.                                       |
| `keycloak_idp_list`                         | R     | List identity providers.                              |
| `keycloak_idp_get`                          | R     | Fetch an identity provider by alias.                  |
| `keycloak_idp_mappers_list`                 | R     | List an identity provider's mappers.                  |
| `keycloak_idp_create`                       | W     | Create an identity provider.                          |
| `keycloak_idp_delete`                       | D     | Delete an identity provider.                          |
| `keycloak_federation_list`                  | R     | List user federation (LDAP/Kerberos) providers.       |
| `keycloak_federation_get`                   | R     | Fetch a federation provider by id.                    |
| `keycloak_federation_sync`                  | W     | Trigger a user sync (full or changed).                |
| `keycloak_auth_flows_list`                  | R     | List authentication flows.                            |
| `keycloak_auth_required_actions_list`       | R     | List required actions.                                |
| `keycloak_auth_required_action_set_enabled` | W     | Enable/disable a required action.                     |
| `keycloak_authz_resources_list`             | R     | List a client's authorization resources.              |
| `keycloak_authz_policies_list`              | R     | List a client's authorization policies.               |
| `keycloak_authz_permissions_list`           | R     | List a client's authorization permissions.            |
| `keycloak_events_login`                     | R     | Read recent login events (filterable).                |
| `keycloak_events_admin`                     | R     | Read recent admin events.                             |
| `keycloak_realm_get_config`                 | R     | Read key realm configuration flags.                   |
| `keycloak_server_info`                      | R     | Read the Keycloak server version.                     |

See [docs/users.md](docs/users.md), [docs/roles.md](docs/roles.md),
[docs/clients.md](docs/clients.md), [docs/groups.md](docs/groups.md) and
[docs/events-realm.md](docs/events-realm.md) for parameters and examples, and
[docs/security.md](docs/security.md) for the safety model.

## Roadmap

The architecture is designed to keep growing as thin use cases + tools.
Remaining candidates: authorization policy/permission CRUD and evaluation,
authentication flow mutation (copy/add executions), and advanced federation and
identity-provider configuration. See [docs/development.md](docs/development.md)
for how to add one.

## Development

```bash
npm install
npm test              # unit tests
npm run test:integration  # spins up a real Keycloak 26 via Testcontainers (needs Docker)
npm run check         # typecheck + lint + format check + unit tests
npm run build         # bundle to dist/
```

Releases are automated — see [docs/releasing.md](docs/releasing.md).

## Contributing

Contributions are welcome — please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
