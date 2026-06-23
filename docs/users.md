# User tools

## `keycloak_user_search` [R]

Search the configured realm's users.

| Parameter  | Type    | Required | Description                             |
| ---------- | ------- | -------- | --------------------------------------- |
| `email`    | string  | no       | Filter by email.                        |
| `username` | string  | no       | Filter by username.                     |
| `search`   | string  | no       | Free-text search (username/email/name). |
| `first`    | integer | no       | Offset for pagination (default `0`).    |
| `max`      | integer | no       | Page size (default `20`, max `500`).    |

Returns a JSON array of users: `id`, `username`, `email`, `enabled`.

Example call arguments:

```json
{ "email": "jean.dupont@example.com" }
```

## `keycloak_user_delete` [D]

Permanently delete a user. **Destructive** — requires confirmation.

| Parameter  | Type    | Required | Description                                          |
| ---------- | ------- | -------- | ---------------------------------------------------- |
| `id`       | string  | yes      | The user's internal id (UUID).                       |
| `username` | string  | yes      | Must match the stored user; guards against wrong-id. |
| `confirm`  | boolean | no       | Used only as the elicitation fallback (see below).   |

Before deleting, the server computes a concrete impact description (the user's
name, email and active session count) and asks for confirmation:

- If the client supports MCP **elicitation**, a native confirmation prompt is
  shown.
- Otherwise, the call must include `confirm: true`; without it the operation is
  refused and the impact is returned instead.

The username must match the user the id points to, otherwise the deletion is
refused — this prevents deleting the wrong account from a stale id.
