# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.3] - 2026-06-26

### Added

- `keycloak_client_create` and `keycloak_client_update` now accept `webOrigins`
  (allowed CORS web origins), alongside the existing `redirectUris`.

### Security

- Force the transitive `esbuild` dev dependency to `>= 0.28.1` (npm `overrides`)
  to clear GHSA-g7r4-m6w7-qqqr. Build-time only — `esbuild` is not part of the
  published package, so the npm artifact is unchanged.

## [0.2.2] - 2026-06-24

### Documentation & tooling

- Richer tool definitions: every tool now has a fuller description (purpose,
  when to use it, side effects and return value) and every parameter carries a
  description, improving how assistants understand and call each tool.
- `glama.json` to declare repository maintainers.

## [0.2.1] - 2026-06-23

### Documentation & tooling

- Publish metadata for the official MCP registry: a `server.json` descriptor and
  an `mcpName` link in `package.json`
  (`io.github.mrz1880/mcp-keycloak-admin`).

## [0.2.0] - 2026-06-23

### Added

- Client CRUD tools: `keycloak_client_create`, `keycloak_client_update`,
  `keycloak_client_delete`.
- Client role tools: `keycloak_client_roles_list`,
  `keycloak_user_client_roles_get`, `keycloak_user_client_role_assign`,
  `keycloak_user_client_role_unassign`.
- More integration round-trips (groups, role assignment, client secret) against
  a real Keycloak 26 container.

### Fixed

- The client, realm-role and group list endpoints now paginate through every
  page instead of returning only Keycloak's first page.

### Documentation & tooling

- `SECURITY.md`, `docs/quickstart.md`, and a README section on running multiple
  Keycloak instances (one server entry each).
- Guidance and `.gitignore` entries to keep credential-bearing MCP client
  configs (`.mcp.json`, …) out of version control.
- CI now builds in the quality job and enforces a coverage floor.

## [0.1.0] - 2026-06-23

### Added

- Project scaffolding: TypeScript, Vitest, ESLint (with Clean Architecture layer
  boundaries), Prettier, husky + lint-staged + commitlint, tsup, GitHub Actions.
- Domain value objects (`RealmName`, `Email`, `Username`, `UserId`, `ClientId`,
  `ClientUuid`, `ClientSecret`, `Password`, `AccessToken`, `ActionEmailType`).
- Access policies (`ToolAccessPolicy`, `RealmAccessPolicy`) and the
  destructive-operation confirmation model.
- Dual authentication (`service_account` / `password`) with token caching and
  refresh.
- Keycloak Admin REST client (bearer injection, 401 retry, pagination, error
  mapping) and a user repository.
- MCP adapter: tool definitions with annotations, read-only gating, and
  destructive-operation confirmation via elicitation with a parameter fallback.
- User tools: `keycloak_user_search`, `keycloak_user_get`,
  `keycloak_user_create`, `keycloak_user_set_enabled`,
  `keycloak_user_send_action_email`, `keycloak_user_reset_password`,
  `keycloak_user_logout`, `keycloak_user_delete`.
- Role tools: `keycloak_role_list`, `keycloak_user_roles_get`,
  `keycloak_user_role_assign`, `keycloak_user_role_unassign`.
- Client tools: `keycloak_client_list`, `keycloak_client_get`,
  `keycloak_client_get_secret`, `keycloak_client_regenerate_secret`.
- Group tools: `keycloak_group_list`, `keycloak_group_create`,
  `keycloak_group_member_add`, `keycloak_group_member_remove`,
  `keycloak_group_delete`.
- Read-only observability tools: `keycloak_events_login`,
  `keycloak_events_admin`, `keycloak_realm_get_config`, `keycloak_server_info`.
- More user & group tools: `keycloak_user_update`,
  `keycloak_user_sessions_list`, `keycloak_group_role_assign`,
  `keycloak_group_members_list`, `keycloak_user_groups_list`.
- Client scope & mapper tools: `keycloak_client_scopes_list`,
  `keycloak_client_default_scopes_get`, `keycloak_client_mappers_list`,
  `keycloak_client_scope_assign`, `keycloak_client_scope_unassign`.
- Identity provider tools: `keycloak_idp_list`, `keycloak_idp_get`,
  `keycloak_idp_mappers_list`, `keycloak_idp_create`, `keycloak_idp_delete`.
- User federation tools: `keycloak_federation_list`,
  `keycloak_federation_get`, `keycloak_federation_sync`.
- Authentication tools: `keycloak_auth_flows_list`,
  `keycloak_auth_required_actions_list`,
  `keycloak_auth_required_action_set_enabled`.
- Read-only authorization-services tools: `keycloak_authz_resources_list`,
  `keycloak_authz_policies_list`, `keycloak_authz_permissions_list`.
- Configuration loader, composition root, and stdio entrypoint.
- Integration test running against a real Keycloak 26 container.
