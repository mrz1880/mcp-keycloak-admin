import type { FederationProvider } from "../../src/domain/federation/federation-provider.js";
import { ComponentId } from "../../src/domain/shared/component-id.js";

export function aFederationProvider(
  name = "ldap",
  id = "fed00000-1234-4035-95a5-237a748eec03",
): FederationProvider {
  return { id: ComponentId.fromString(id), name, providerId: "ldap" };
}
