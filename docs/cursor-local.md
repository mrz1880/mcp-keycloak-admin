# Cursor + local Keycloak

Point Cursor at this fork (or a built checkout) and a local Keycloak.

## 1. Keycloak client

Follow [setup-keycloak.md](setup-keycloak.md). For flow tools you also need
`manage-realm` (bind/copy) in addition to `view-realm`.

## 2. Cursor MCP config

User or project `mcp.json` (paths adjusted to your machine):

```json
{
  "mcpServers": {
    "keycloak": {
      "command": "node",
      "args": ["/home/edewit/workspace/mcp-keycloak-admin/dist/index.js"],
      "env": {
        "KEYCLOAK_BASE_URL": "http://localhost:8080",
        "KEYCLOAK_REALM": "master",
        "AUTH_MODE": "password",
        "KC_ADMIN_USERNAME": "admin",
        "KC_ADMIN_PASSWORD": "admin",
        "KC_ADMIN_REALM": "master",
        "READ_ONLY": "false"
      }
    }
  }
}
```

Prefer `AUTH_MODE=service_account` with `KC_CLIENT_ID` / `KC_CLIENT_SECRET` once
the `mcp-admin` client exists.

Rebuild after pulling: `npm run build`.

## 3. Skill pack

Install the local Keycloak skill under `~/.cursor/skills/keycloak/` (router +
`references/`). It tells the agent which MCP tools to call for common admin
intents.
