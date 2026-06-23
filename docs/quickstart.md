# Quickstart

Try the server against a throwaway Keycloak in a couple of minutes.

## 1. Start a local Keycloak

```yaml
# docker-compose.yml
services:
  keycloak:
    image: quay.io/keycloak/keycloak:26.0.5
    command: ["start-dev"]
    environment:
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: admin
    ports:
      - "8080:8080"
```

```bash
docker compose up -d
```

## 2. Point an MCP client at the server

For a quick local try you can use the admin user directly (use a service account
in production — see [setup-keycloak.md](setup-keycloak.md)):

```json
{
  "mcpServers": {
    "keycloak-admin": {
      "command": "npx",
      "args": ["-y", "mcp-keycloak-admin"],
      "env": {
        "KEYCLOAK_BASE_URL": "http://localhost:8080",
        "KEYCLOAK_REALM": "master",
        "AUTH_MODE": "password",
        "KC_ADMIN_USERNAME": "admin",
        "KC_ADMIN_PASSWORD": "admin",
        "READ_ONLY": "true"
      }
    }
  }
}
```

Starting with `READ_ONLY=true` exposes only the read tools — a safe way to
explore. Remove it once you trust the setup.

## 3. Try a tool

Ask your MCP client to run `keycloak_server_info` or `keycloak_user_search`.
