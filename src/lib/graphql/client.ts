import { GraphQLClient, ClientError } from "graphql-request";
import { GRAPHQL_URL } from "@/lib/env";
import { supabase } from "@/lib/supabase/client";

/**
 * GraphQL transport — Bearer, not cookies (doc 12 §6). Every request attaches
 * the Supabase access token as `Authorization: Bearer <jwt>`. `getSession()`
 * transparently refreshes the token on expiry, so the interceptor always sends a
 * live one. apps/api verifies it via JWKS and enforces org + role + AAL2.
 */

export type AuthErrorKind =
  | "unauthenticated"
  | "mfa_required"
  | "forbidden"
  | "unknown";

export class GraphqlAuthError extends Error {
  kind: AuthErrorKind;
  constructor(kind: AuthErrorKind, message: string) {
    super(message);
    this.name = "GraphqlAuthError";
    this.kind = kind;
  }
}

async function bearerToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

function client(token: string | null): GraphQLClient {
  return new GraphQLClient(GRAPHQL_URL, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

/** Map an apps/api auth error to a typed kind the UI can route on (doc §6.5). */
function classify(err: unknown): AuthErrorKind | null {
  if (!(err instanceof ClientError)) return null;
  const codes = (err.response?.errors ?? [])
    .map((e) => String((e.extensions?.code ?? "")).toLowerCase())
    .concat(
      (err.response?.errors ?? []).map((e) => e.message.toLowerCase()),
    );
  const has = (needle: string) => codes.some((c) => c.includes(needle));
  if (has("mfa")) return "mfa_required";
  if (has("unauthenticated") || has("unauthorized")) return "unauthenticated";
  if (has("forbidden") || has("denied")) return "forbidden";
  return "unknown";
}

export async function gqlRequest<T>(
  document: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await bearerToken();
  try {
    return await client(token).request<T>(document, variables);
  } catch (err) {
    const kind = classify(err);
    if (kind) {
      throw new GraphqlAuthError(
        kind,
        err instanceof Error ? err.message : "GraphQL auth error",
      );
    }
    throw err;
  }
}
