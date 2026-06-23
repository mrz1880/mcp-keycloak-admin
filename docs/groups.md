# Group tools

## `keycloak_group_list` [R]

List the realm's top-level groups. No parameters. Returns `id`, `name`, `path`.

## `keycloak_group_create` [W]

Create a top-level group.

| Parameter | Type   | Required | Description     |
| --------- | ------ | -------- | --------------- |
| `name`    | string | yes      | The group name. |

## `keycloak_group_member_add` [W]

Add a user to a group.

| Parameter | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `groupId` | string | yes      | The group id (UUID). |
| `userId`  | string | yes      | The user id (UUID).  |

## `keycloak_group_member_remove` [D]

Remove a user from a group. **Destructive** — requires confirmation. The user
loses every role and permission granted through the group.

| Parameter | Type    | Required | Description                    |
| --------- | ------- | -------- | ------------------------------ |
| `groupId` | string  | yes      | The group id (UUID).           |
| `userId`  | string  | yes      | The user id (UUID).            |
| `confirm` | boolean | no       | Elicitation fallback approval. |

## `keycloak_group_delete` [D]

Delete a group. **Destructive** — requires confirmation. Removes the group, its
sub-groups, and every membership and role mapping it carries.

| Parameter | Type    | Required | Description                    |
| --------- | ------- | -------- | ------------------------------ |
| `id`      | string  | yes      | The group id (UUID).           |
| `confirm` | boolean | no       | Elicitation fallback approval. |
