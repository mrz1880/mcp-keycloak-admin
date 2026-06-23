# Security model

This server administers Keycloak, so it is deliberately conservative.

## Layers of protection

1. **Least-privilege credentials.** In `service_account` mode the server uses a
   dedicated confidential client whose service account holds only the
   `realm-management` roles it needs (see
   [setup-keycloak.md](setup-keycloak.md)). It never needs the master admin
   password.

2. **`READ_ONLY` mode.** When `READ_ONLY=true`, write and destructive tools are
   **not registered at all** — they are invisible to the client, not merely
   refused.

3. **`ALLOWED_REALMS` allow-list.** The target realm is checked at startup; a
   realm outside a non-empty allow-list makes the server refuse to start.

4. **Per-operation confirmation.** Every destructive tool computes a concrete,
   named impact description and requires explicit confirmation before acting:
   - native MCP **elicitation** where supported;
   - an explicit `confirm: true` parameter as a fallback. Without confirmation,
     nothing is mutated and the impact is returned.

5. **Wrong-target guards.** For example, deleting a user requires the supplied
   username to match the user the id resolves to.

## Secret handling

- Secrets are read only from environment variables, never accepted as tool
  arguments.
- The `Password` and `ClientSecret` value objects never expose their value
  through `toString()` / JSON serialization; revealing requires an explicit
  call.
- Access tokens and sensitive request bodies are kept out of logs.

## Reporting a vulnerability

Please open a private security advisory or contact the maintainers rather than
filing a public issue.
