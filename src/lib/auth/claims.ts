import type { User, Session } from "@supabase/supabase-js";

/**
 * B2B JWT claims live in `app_metadata` (server-controlled, tamper-proof) —
 * doc 02 §3. They are read straight off the verified token with zero DB queries.
 *
 *   app_metadata.organization_id : string (uuid) | absent for pure B2C
 *   app_metadata.org_role        : OrgRole
 *   app_metadata.seniority_level : 'l1' | 'l2' | 'l3'  (bottom-up, D4)
 */

export type OrgRole =
  | "employee"
  | "manager"
  | "hr_ops"
  | "chro"
  | "ceo"
  | "leadership"
  | "wellbeing_committee"
  | "org_admin";

export type SeniorityLevel = "l1" | "l2" | "l3";

export interface OrgClaims {
  organizationId: string;
  orgRole: OrgRole;
  seniorityLevel: SeniorityLevel | null;
}

/**
 * Who may log into b2b-dashboard (DA-1 recommendation, 🟠 NEEDS-INPUT):
 * HR + leadership + L2 managers (team views). L1 individual contributors use
 * md-latest only and must NOT reach an employer surface here.
 * TODO(QA-DA-1): confirm the exact audience; if L1 should be hard-denied at the
 * API too, this client gate is only UX — the apps/api AuthGuard is the real wall.
 */
export const EMPLOYER_ROLES: readonly OrgRole[] = [
  "manager",
  "hr_ops",
  "chro",
  "ceo",
  "leadership",
  "wellbeing_committee",
  "org_admin",
] as const;

export function isEmployerRole(role: string | null | undefined): boolean {
  return !!role && (EMPLOYER_ROLES as readonly string[]).includes(role);
}

/** Roles that may MANAGE campaigns/participation (HR_ADMIN-equivalent), doc 10 §6. */
export function canManageParticipation(role: OrgRole | null | undefined): boolean {
  return role === "hr_ops" || role === "org_admin";
}

type AppMetadata = {
  organization_id?: unknown;
  org_role?: unknown;
  seniority_level?: unknown;
};

export function readOrgClaims(
  user: User | null | undefined,
): OrgClaims | null {
  const meta = (user?.app_metadata ?? {}) as AppMetadata;
  const organizationId =
    typeof meta.organization_id === "string" ? meta.organization_id : null;
  const orgRole = typeof meta.org_role === "string" ? (meta.org_role as OrgRole) : null;
  const seniorityLevel =
    meta.seniority_level === "l1" ||
    meta.seniority_level === "l2" ||
    meta.seniority_level === "l3"
      ? meta.seniority_level
      : null;

  if (!organizationId || !orgRole) return null;
  return { organizationId, orgRole, seniorityLevel };
}

/** True when the session/user is an employer member who may use this app. */
export function hasEmployerAccess(user: User | null | undefined): boolean {
  const claims = readOrgClaims(user);
  return !!claims && isEmployerRole(claims.orgRole);
}

export function getAccessToken(session: Session | null | undefined): string | null {
  return session?.access_token ?? null;
}
