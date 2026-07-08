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

/**
 * TEMPORARY escape hatch: NEXT_PUBLIC_DISABLE_MFA=true turns off the mandatory-MFA
 * gate on the client + middleware (demo convenience). Default-off — unset the env
 * var and rebuild to restore mandatory MFA. Must be paired with DISABLE_MFA on the
 * API (apps/api), which is the real wall.
 */
export function mfaDisabled(): boolean {
  return process.env.NEXT_PUBLIC_DISABLE_MFA === "true";
}

/** AAL1→AAL2 trigger: the user has a verified factor but hasn't passed it yet. */
export function needsMfaVerification(
  aal: AalData | null | undefined,
): boolean {
  if (mfaDisabled()) return false;
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
