import type { AuthMFAGetAuthenticatorAssuranceLevelResponse } from "@supabase/supabase-js";

// The `data` payload of getAuthenticatorAssuranceLevel() — the response type is
// the full { data, error } envelope, so we index into `data`.
type AalData = AuthMFAGetAuthenticatorAssuranceLevelResponse["data"];

/**
 * MFA helpers — modelled on md-admin `src/lib/auth/admin-mfa.ts`. Reuses
 * Supabase Auth TOTP (same mechanism). MFA is MANDATORY for every user here:
 * the dashboard gates every route on AAL2 (UX), and apps/api independently
 * enforces AAL2 (the real wall).
 */

export const MFA_PAGE = "/mfa";
export const LOGIN_PAGE = "/login";

/** AAL1→AAL2 trigger: the user has a verified factor but hasn't passed it yet. */
export function needsMfaVerification(
  aal: AalData | null | undefined,
): boolean {
  if (!aal) return false;
  return aal.currentLevel === "aal1" && aal.nextLevel === "aal2";
}

/** Already at the highest assurance the account supports. */
export function isAal2(
  aal: AalData | null | undefined,
): boolean {
  return aal?.currentLevel === "aal2";
}

export function buildMfaRedirectUrl(redirectPath?: string | null): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return MFA_PAGE;
  }
  return `${MFA_PAGE}?redirect=${encodeURIComponent(redirectPath)}`;
}

export function buildLoginRedirectUrl(redirectPath?: string | null): string {
  if (!redirectPath || !redirectPath.startsWith("/") || redirectPath.startsWith("//")) {
    return LOGIN_PAGE;
  }
  return `${LOGIN_PAGE}?redirect=${encodeURIComponent(redirectPath)}`;
}
