# Development

## Architecture

Clean Architecture / Hexagonal, dependencies pointing inward:

```
infrastructure  (Keycloak REST adapters, auth providers, MCP driving adapter)
      │  implements ports / calls use cases
application     (one class per use case, `execute()`)
      │  uses
domain          (value objects, ports, policies) — no framework/infra imports
```

- **domain** (`src/domain`): self-validating value objects (`RealmName`,
  `Email`, `UserId`, …), ports (interfaces), and policies (`ToolAccessPolicy`,
  `RealmAccessPolicy`, destructive-operation confirmation). No primitive
  obsession — business concepts are value objects, validated in their
  constructor.
- **application** (`src/application`): use cases orchestrating ports and
  policies. One class per use case with a single `execute()` method.
- **infrastructure** (`src/infrastructure`): Keycloak Admin REST adapters
  (admin client, repositories, error mapping), token providers, and the MCP
  adapter (tool definitions, confirmation, registry).
- **composition root** (`src/server.ts`, `src/index.ts`): wires everything and
  connects the stdio transport.

The layer boundaries are enforced by ESLint (`eslint-plugin-boundaries`): a
domain file importing infrastructure fails linting.

## Workflow

This project is built test-first (classicist TDD): write a failing test, watch
it fail for the right reason, write the minimal code to pass, refactor. Only
boundaries (network, clock) are mocked; real domain objects collaborate in
tests.

```bash
npm test                  # fast unit tests
npm run test:integration  # real Keycloak 26 via Testcontainers (needs Docker)
npm run check             # typecheck + lint + format check + unit tests
npm run build             # bundle to dist/
```

Commits follow Conventional Commits (enforced by commitlint); a pre-commit hook
runs ESLint and Prettier on staged files.

## Adding a tool

1. **Domain** — add any missing value objects, and extend the relevant port
   interface (e.g. `UserRepository`).
2. **Application** — add a use case class (`src/application/...`), test it with
   an in-memory fake of the port.
3. **Infrastructure (Keycloak)** — implement the new port method on the REST
   repository, test it with a faked `fetch`.
4. **Infrastructure (MCP)** — add a `ToolDefinition` (input schema, level,
   annotations, handler) and include it in the builder; destructive tools take a
   `Confirmer` from the factory.
5. Wire it in the composition root if a new builder was introduced.
