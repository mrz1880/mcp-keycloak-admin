# Releasing

Releases are published to npm automatically by the **Release** workflow
(`.github/workflows/release.yml`) when a `v*` tag is pushed. Provenance
attestations are generated automatically.

## How publishing is authenticated

- **Trusted Publishing (OIDC) — preferred, no secret.** Once the trusted
  publisher is configured on npm (package → _Settings → Trusted publishing →
  GitHub Actions_, repository `mrz1880/mcp-keycloak-admin`, workflow
  `release.yml`), the workflow authenticates via short-lived OIDC credentials.
- **`NPM_TOKEN` bootstrap fallback.** If an `NPM_TOKEN` repo secret is set
  (granular token, Read + write, **Bypass 2FA** enabled), the workflow publishes
  with it instead. This is only needed for the very first publish, before the
  package exists; delete the secret once Trusted Publishing is configured.

The workflow auto-selects the path based on whether `NPM_TOKEN` is present.

## Cutting a release

1. Make sure `main` is green:

   ```bash
   npm run check
   npm run test:integration   # optional, needs Docker
   ```

2. Bump the version and update the changelog:

   ```bash
   npm version <patch|minor|major> --no-git-tag-version
   ```

   Then move the `## [Unreleased]` notes in `CHANGELOG.md` under the new
   `## [X.Y.Z] - YYYY-MM-DD` heading.

3. Commit and push `main`:

   ```bash
   git commit -am "chore(release): vX.Y.Z"
   git push origin main
   ```

4. Tag and push — this triggers the publish:

   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z"
   git push origin vX.Y.Z
   ```

5. Watch and verify:

   ```bash
   gh run watch --workflow=release.yml
   npm view mcp-keycloak-admin version
   ```

6. Publish the GitHub release notes:

   ```bash
   gh release create vX.Y.Z --generate-notes
   ```

## Versioning

[Semantic Versioning](https://semver.org). New tools or optional parameters →
**minor**; bug fixes → **patch**; breaking changes to tool names/inputs or
required configuration → **major**.

## Requirements that bit us once (keep them satisfied)

- `package.json` must keep a `repository.url` matching the GitHub repo, or
  provenance verification fails with `E422`.
- The bootstrap `NPM_TOKEN` must have **Bypass 2FA** enabled, or publishing
  fails with `E403` when the account enforces 2FA.
