# Setting up Keycloak for the MCP server

The recommended mode is `service_account`: a dedicated confidential client with
a service account that holds only the roles the server needs.

## 1. Create the client

In the target realm:

1. **Clients → Create client**
   - Client type: **OpenID Connect**
   - Client ID: `mcp-admin`
2. **Capability config**
   - Client authentication: **On** (confidential)
   - Authentication flow: enable **Service accounts roles**, disable
     **Standard flow** and **Direct access grants** (not needed).
3. Save, then open **Credentials** and copy the **Client secret** into
   `KC_CLIENT_SECRET`.

## 2. Grant least-privilege roles

Open the client's **Service accounts roles** tab and assign, from the
`realm-management` client, only the roles matching the tools you enable:

| Capability        | `realm-management` roles |
| ----------------- | ------------------------ |
| Read users        | `view-users`             |
| Manage users      | `manage-users`           |
| Read clients      | `view-clients`           |
| Read events       | `view-events`            |
| Read realm config | `view-realm`             |

For the currently implemented user tools, `view-users` (search) and
`manage-users` (delete) are sufficient.

## 3. Configure the server

```env
KEYCLOAK_BASE_URL=http://localhost:8080
KEYCLOAK_REALM=your-realm
AUTH_MODE=service_account
KC_CLIENT_ID=mcp-admin
KC_CLIENT_SECRET=the-copied-secret
```

## Alternative: password mode (local only)

For quick local use you can use an admin user instead:

```env
AUTH_MODE=password
KC_ADMIN_USERNAME=admin
KC_ADMIN_PASSWORD=admin
KC_ADMIN_REALM=master
```

This grants full admin rights and stores an admin password, so prefer
`service_account` outside local development.
