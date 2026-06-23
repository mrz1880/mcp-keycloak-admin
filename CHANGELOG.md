# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
