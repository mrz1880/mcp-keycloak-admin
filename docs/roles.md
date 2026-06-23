# Role tools

These tools manage **realm** roles and their assignment to users.

## `keycloak_role_list` [R]

List the realm roles. No parameters. Returns `id`, `name`, `description`.

## `keycloak_user_roles_get` [R]

List the realm roles assigned to a user.

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `userId`  | string | yes      | The user's id (UUID). |

## `keycloak_user_role_assign` [W]

Grant a realm role to a user. The role is resolved by name; an unknown role is
reported back without changing anything.

| Parameter | Type   | Required | Description           |
| --------- | ------ | -------- | --------------------- |
| `userId`  | string | yes      | The user's id (UUID). |
| `role`    | string | yes      | The realm role name.  |

## `keycloak_user_role_unassign` [D]

Revoke a realm role from a user. **Destructive** — requires confirmation
(elicitation, or `confirm: true` as a fallback). The user immediately loses
every permission granted by the role.

| Parameter | Type    | Required | Description                    |
| --------- | ------- | -------- | ------------------------------ |
| `userId`  | string  | yes      | The user's id (UUID).          |
| `role`    | string  | yes      | The realm role name.           |
| `confirm` | boolean | no       | Elicitation fallback approval. |
