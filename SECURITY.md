# Security Policy

## Reporting a vulnerability

Please report security vulnerabilities **privately** rather than opening a public
issue:

- Use GitHub's private vulnerability reporting on this repository
  (_Security → Report a vulnerability_), or
- contact the maintainers directly.

We aim to acknowledge reports promptly and will coordinate a fix and disclosure
timeline with you.

## Scope

This server administers Keycloak with privileged credentials. See
[docs/security.md](docs/security.md) for the threat model and the built-in
guardrails (`READ_ONLY`, `ALLOWED_REALMS`, per-operation confirmation of
destructive actions, and secret masking).

## Supported versions

The latest published `0.x` release receives security fixes.
