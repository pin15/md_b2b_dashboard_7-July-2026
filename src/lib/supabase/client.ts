import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient, Session, User } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/env";

/**
 * Supabase browser client — AUTH ONLY (login, session, MFA).
 *
 * This app does NOT use Supabase for data: no `.from()`, no `.rpc()`, no
 * service-role key. All dashboard data comes from the GraphQL API. The anon
 * (publishable) key is safe to ship to the browser; it is not a secret.
 * Modelled on md-admin `src/lib/supabase/client.ts`, trimmed to auth.
 */
let clientInstance: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (clientInstance) return clientInstance;
  clientInstance = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return clientInstance;
}

export const supabase = createSupabaseBrowserClient();

export async function getSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("getSession error:", error.message);
    return null;
  }
  return data.session;
}

export async function getUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    console.error("getUser error:", error.message);
    return null;
  }
  return data.user;
}

export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("signOut error:", error.message);
    return false;
  }
  return true;
}
