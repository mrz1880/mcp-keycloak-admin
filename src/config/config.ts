import { z } from "zod";

const baseSchema = z.object({
  KEYCLOAK_BASE_URL: z.string().min(1),
  KEYCLOAK_REALM: z.string().min(1),
  READ_ONLY: z.string().optional(),
  ALLOWED_REALMS: z.string().optional(),
});

const authSchema = z.discriminatedUnion("AUTH_MODE", [
  z.object({
    AUTH_MODE: z.literal("service_account"),
    KC_CLIENT_ID: z.string().min(1),
    KC_CLIENT_SECRET: z.string().min(1),
  }),
  z.object({
    AUTH_MODE: z.literal("password"),
    KC_ADMIN_USERNAME: z.string().min(1),
    KC_ADMIN_PASSWORD: z.string().min(1),
    KC_ADMIN_REALM: z.string().min(1).default("master"),
  }),
]);

const schema = z.intersection(baseSchema, authSchema);

export type AuthConfig =
  | { readonly mode: "service_account"; clientId: string; clientSecret: string }
  | {
      readonly mode: "password";
      username: string;
      password: string;
      adminRealm: string;
    };

export interface AppConfig {
  readonly baseUrl: string;
  readonly realm: string;
  readonly readOnly: boolean;
  readonly allowedRealms: string[];
  readonly auth: AuthConfig;
}

function parseRealms(raw: string | undefined): string[] {
  if (raw === undefined) {
    return [];
  }
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function toAuthConfig(parsed: z.infer<typeof schema>): AuthConfig {
  if (parsed.AUTH_MODE === "service_account") {
    return {
      mode: "service_account",
      clientId: parsed.KC_CLIENT_ID,
      clientSecret: parsed.KC_CLIENT_SECRET,
    };
  }
  return {
    mode: "password",
    username: parsed.KC_ADMIN_USERNAME,
    password: parsed.KC_ADMIN_PASSWORD,
    adminRealm: parsed.KC_ADMIN_REALM,
  };
}

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  const result = schema.safeParse(env);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid configuration: ${details}`);
  }
  const parsed = result.data;
  return {
    baseUrl: parsed.KEYCLOAK_BASE_URL,
    realm: parsed.KEYCLOAK_REALM,
    readOnly: parsed.READ_ONLY === "true",
    allowedRealms: parseRealms(parsed.ALLOWED_REALMS),
    auth: toAuthConfig(parsed),
  };
}
