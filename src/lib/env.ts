/**
 * Public environment surface. ONLY NEXT_PUBLIC_* values, and NONE may be a
 * secret. There is intentionally no service-role key anywhere in this app.
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
export const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? "";

/**
 * Mock-first mode (doc §9): when on, the GraphQL client returns local fixtures
 * instead of hitting the network, so the UI is buildable/verifiable before
 * Supabase + apps/api are wired. On by default unless a GRAPHQL_URL is set and
 * USE_MOCK is explicitly "false".
 */
export const USE_MOCK =
  process.env.NEXT_PUBLIC_USE_MOCK === "true" || GRAPHQL_URL === "";

/** Whether real Supabase Auth is configured (else login is mock/disabled). */
export const HAS_SUPABASE = SUPABASE_URL !== "" && SUPABASE_ANON_KEY !== "";
