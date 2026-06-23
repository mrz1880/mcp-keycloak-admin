# Contributing

Thanks for your interest in improving mcp-keycloak-admin!

## Getting started

```bash
npm install
npm run check   # typecheck + lint + format + unit tests
```

## Ground rules

- **Test-first.** Add a failing test before the code that makes it pass. Mock
  only boundaries (network, clock); let real domain objects collaborate.
- **Respect the layers.** `domain` must not import `application` or
  `infrastructure`; `application` must not import `infrastructure`. ESLint
  enforces this.
- **No primitive obsession.** Model business concepts as value objects validated
  in their constructor, not raw strings/numbers.
- **TypeScript conventions.** No `any`; constructor-only fields are `readonly`;
  prefer optional chaining.
- **Conventional Commits.** Commit messages are linted (e.g.
  `feat(users): add reset password use case`).

## Pull requests

1. Create a branch.
2. Keep the change focused and covered by tests.
3. Ensure `npm run check` passes; run `npm run test:integration` if you touched
   the Keycloak adapters (requires Docker).
4. Open the PR with a clear description of the behavior change.

See [docs/development.md](docs/development.md) for the architecture and a guide
to adding a tool.
