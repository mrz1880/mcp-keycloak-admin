# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- Tools: `keycloak_user_search`, `keycloak_user_delete`.
- Configuration loader, composition root, and stdio entrypoint.
- Integration test running against a real Keycloak 26 container.
