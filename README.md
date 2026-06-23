# mcp-keycloak-admin

A [Model Context Protocol](https://modelcontextprotocol.io) (MCP) server to
administer a [Keycloak](https://www.keycloak.org) instance through its Admin
REST API. Safe by default, configurable, and built with a clean, test-driven
architecture.

Compatible with **Keycloak 26.x** (validated against 26.0.5).

> **Project status:** early. The architecture, tooling and safety model are in
> place and exercised by unit and integration tests. The exposed tool surface is
> being grown incrementally — see [Tools](#tools) and [Roadmap](#roadmap).

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
        "KEYCLOAK_REALM": "Pandi-Panda",
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

| Tool                              | Level | Description                                           |
| --------------------------------- | ----- | ----------------------------------------------------- |
| `keycloak_user_search`            | R     | Search realm users by email, username or free text.   |
| `keycloak_user_get`               | R     | Fetch a single user by id.                            |
| `keycloak_user_create`            | W     | Create a realm user.                                  |
| `keycloak_user_set_enabled`       | W     | Enable or disable a user.                             |
| `keycloak_user_send_action_email` | W     | Send a required-actions email.                        |
| `keycloak_user_reset_password`    | D     | Set a new password for a user.                        |
| `keycloak_user_logout`            | D     | Revoke all of a user's sessions.                      |
| `keycloak_user_delete`            | D     | Permanently delete a user (id + username must match). |
| `keycloak_role_list`              | R     | List realm roles.                                     |
| `keycloak_user_roles_get`         | R     | List a user's realm roles.                            |
| `keycloak_user_role_assign`       | W     | Grant a realm role to a user.                         |
| `keycloak_user_role_unassign`     | D     | Revoke a realm role from a user.                      |

See [docs/users.md](docs/users.md) and [docs/roles.md](docs/roles.md) for
parameters and examples, and [docs/security.md](docs/security.md) for the safety
model.

## Roadmap

The architecture is designed to grow the remaining Keycloak admin surface as
thin use cases + tools: more user operations (create, update, reset password,
sessions), roles & groups, clients (read, secrets, scopes), and read-only events
& realm info. See [docs/development.md](docs/development.md) for how to add one.

## Development

```bash
npm install
npm test              # unit tests
npm run test:integration  # spins up a real Keycloak 26 via Testcontainers (needs Docker)
npm run check         # typecheck + lint + format check + unit tests
npm run build         # bundle to dist/
```

## Contributing

Contributions are welcome — please read [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
