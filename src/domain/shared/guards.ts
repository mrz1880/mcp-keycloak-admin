const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function ensureNonBlank(value: string, label: string): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} cannot be empty`);
  }
  return trimmed;
}

export function ensureUuid(value: string, label: string): string {
  const trimmed = value.trim();
  if (!UUID_PATTERN.test(trimmed)) {
    throw new Error(`${label} must be a valid UUID`);
  }
  return trimmed;
}
