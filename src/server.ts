import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

import type { AppConfig } from "./config/config.js";
import { RealmAccessPolicy } from "./domain/policy/realm-access-policy.js";
import { ToolAccessPolicy } from "./domain/policy/tool-access-policy.js";
import type { TokenProvider } from "./domain/ports/token-provider.js";
import { RealmName } from "./domain/shared/realm-name.js";
import { createClientCredentialsProvider } from "./infrastructure/auth/client-credentials-provider.js";
import { createPasswordProvider } from "./infrastructure/auth/password-provider.js";
import { systemClock } from "./infrastructure/auth/system-clock.js";
import type { FetchFn } from "./infrastructure/auth/token-endpoint.js";
import { KeycloakAdminClient } from "./infrastructure/keycloak/admin-client.js";
import { KeycloakRoleRepository } from "./infrastructure/keycloak/role-repository.js";
import { KeycloakUserRepository } from "./infrastructure/keycloak/user-repository.js";
import { McpConfirmerFactory } from "./infrastructure/mcp/confirmation/confirmer-factory.js";
import { buildRoleTools } from "./infrastructure/mcp/role-tools.js";
import {
  filterTools,
  registerTools,
} from "./infrastructure/mcp/tool-registry.js";
import { buildUserTools } from "./infrastructure/mcp/user-tools.js";

const httpFetch: FetchFn = (url, init) => fetch(url, init);

function createTokenProvider(config: AppConfig): TokenProvider {
  if (config.auth.mode === "service_account") {
    return createClientCredentialsProvider(
      {
        baseUrl: config.baseUrl,
        realm: config.realm,
        clientId: config.auth.clientId,
        clientSecret: config.auth.clientSecret,
      },
      httpFetch,
      systemClock,
    );
  }
  return createPasswordProvider(
    {
      baseUrl: config.baseUrl,
      realm: config.auth.adminRealm,
      username: config.auth.username,
      password: config.auth.password,
    },
    httpFetch,
    systemClock,
  );
}

export function createServer(config: AppConfig): McpServer {
  RealmAccessPolicy.of(
    config.allowedRealms.map((realm) => RealmName.fromString(realm)),
  ).assertAllowed(RealmName.fromString(config.realm));

  const server = new McpServer({
    name: "mcp-keycloak-admin",
    version: "0.0.0",
  });

  const tokens = createTokenProvider(config);
  const client = new KeycloakAdminClient(
    { baseUrl: config.baseUrl, realm: config.realm },
    tokens,
    httpFetch,
  );
  const userRepository = new KeycloakUserRepository(client);
  const roleRepository = new KeycloakRoleRepository(client);
  const confirmers = new McpConfirmerFactory(server);

  const tools = filterTools(
    [
      ...buildUserTools({ userRepository, confirmers }),
      ...buildRoleTools({ roleRepository, confirmers }),
    ],
    ToolAccessPolicy.of(config.readOnly),
  );
  registerTools(server, tools);

  return server;
}
