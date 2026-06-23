export class KeycloakError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "KeycloakError";
  }
}

function extractDetail(body: unknown): string | null {
  if (typeof body !== "object" || body === null) {
    return null;
  }
  const record = body as Record<string, unknown>;
  const candidate =
    record.errorMessage ?? record.error_description ?? record.error;
  return typeof candidate === "string" ? candidate : null;
}

export function toReadableKeycloakError(
  status: number,
  body: unknown,
): KeycloakError {
  const detail = extractDetail(body);
  switch (status) {
    case 401:
      return new KeycloakError(401, "Authentication failed");
    case 403:
      return new KeycloakError(
        403,
        "Permission denied: the configured credentials lack the required role",
      );
    case 404:
      return new KeycloakError(404, "Resource not found");
    case 409:
      return new KeycloakError(
        409,
        detail !== null
          ? `Conflict: ${detail}`
          : "Conflict: the resource already exists",
      );
    default:
      return new KeycloakError(
        status,
        detail !== null
          ? `Keycloak request failed: ${detail}`
          : `Keycloak request failed (HTTP ${String(status)})`,
      );
  }
}
