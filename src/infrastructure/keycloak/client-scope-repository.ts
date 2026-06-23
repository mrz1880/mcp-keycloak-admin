import type {
  ClientScope,
  ProtocolMapper,
} from "../../domain/clientscope/client-scope.js";
import type { ClientScopeRepository } from "../../domain/ports/client-scope-repository.js";
import { ClientScopeId } from "../../domain/shared/client-scope-id.js";
import { ClientScopeName } from "../../domain/shared/client-scope-name.js";
import type { ClientUuid } from "../../domain/shared/client-uuid.js";
import type { KeycloakAdminClient } from "./admin-client.js";

interface KeycloakClientScope {
  readonly id: string;
  readonly name: string;
  readonly protocol?: string;
}

interface KeycloakMapper {
  readonly id: string;
  readonly name: string;
  readonly protocol?: string;
  readonly protocolMapper?: string;
}

function toScope(raw: KeycloakClientScope): ClientScope {
  return {
    id: ClientScopeId.fromString(raw.id),
    name: ClientScopeName.fromString(raw.name),
    protocol: raw.protocol ?? "openid-connect",
  };
}

function toMapper(raw: KeycloakMapper): ProtocolMapper {
  return {
    id: raw.id,
    name: raw.name,
    protocol: raw.protocol ?? "openid-connect",
    type: raw.protocolMapper ?? "unknown",
  };
}

export class KeycloakClientScopeRepository implements ClientScopeRepository {
  constructor(private readonly client: KeycloakAdminClient) {}

  async listScopes(): Promise<ClientScope[]> {
    const raw =
      await this.client.getJson<KeycloakClientScope[]>("/client-scopes");
    return raw.map(toScope);
  }

  async findScopeByName(name: ClientScopeName): Promise<ClientScope | null> {
    const scopes = await this.listScopes();
    return scopes.find((scope) => scope.name.equals(name)) ?? null;
  }

  async defaultScopes(clientUuid: ClientUuid): Promise<ClientScope[]> {
    const raw = await this.client.getJson<KeycloakClientScope[]>(
      `/clients/${clientUuid.toString()}/default-client-scopes`,
    );
    return raw.map(toScope);
  }

  assignDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void> {
    return this.client.put(
      `/clients/${clientUuid.toString()}/default-client-scopes/${scopeId.toString()}`,
    );
  }

  removeDefaultScope(
    clientUuid: ClientUuid,
    scopeId: ClientScopeId,
  ): Promise<void> {
    return this.client.delete(
      `/clients/${clientUuid.toString()}/default-client-scopes/${scopeId.toString()}`,
    );
  }

  async listMappers(clientUuid: ClientUuid): Promise<ProtocolMapper[]> {
    const raw = await this.client.getJson<KeycloakMapper[]>(
      `/clients/${clientUuid.toString()}/protocol-mappers/models`,
    );
    return raw.map(toMapper);
  }
}
