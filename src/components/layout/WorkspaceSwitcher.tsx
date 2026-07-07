"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, UsersRound, User } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import { readOrgClaims, type OrgClaims } from "@/lib/auth/claims";
import { cn } from "@/lib/utils";

/**
 * Workspace switcher (doc 04 §1.2). Lets a user flip between the employer lenses
 * they're entitled to — Organisation (the org dashboard) vs My Teams (own team).
 * Entitlements are re-derived from the JWT claims (UX gate only; apps/api's
 * AuthGuard + each RPC's in-DB scope check is the authoritative wall). It renders
 * NOTHING when the user has ≤1 workspace — exactly as the spec requires.
 *
 * "Me" (the sealed personal portal) lives in the client app (md-latest), not here;
 * we surface it only when NEXT_PUBLIC_ME_APP_URL is configured, never as a dead link.
 */

const ME_APP_URL = process.env.NEXT_PUBLIC_ME_APP_URL ?? "";

interface Workspace {
  key: "me" | "teams" | "org";
  label: string;
  href: string;
  external?: boolean;
  icon: typeof Building2;
}

function entitledWorkspaces(claims: OrgClaims | null): Workspace[] {
  // Demo / mock mode (no Supabase): show both employer lenses so the switcher is
  // visible and exercisable without a live session.
  const orgRole = claims?.orgRole ?? null;
  const level = claims?.seniorityLevel ?? null;

  const orgLensRoles = ["hr_ops", "chro", "ceo", "leadership", "org_admin", "wellbeing_committee"];
  const canOrg = !claims || level === "l3" || (orgRole != null && orgLensRoles.includes(orgRole));
  const canTeams = !claims || orgRole === "manager" || level === "l2";

  const ws: Workspace[] = [];
  if (ME_APP_URL) ws.push({ key: "me", label: "Me", href: ME_APP_URL, external: true, icon: User });
  if (canTeams) ws.push({ key: "teams", label: "My Teams", href: "/teams", icon: UsersRound });
  if (canOrg) ws.push({ key: "org", label: "Organisation", href: "/dashboard", icon: Building2 });
  return ws;
}

export function WorkspaceSwitcher() {
  const pathname = usePathname();
  const [claims, setClaims] = useState<OrgClaims | null>(null);

  useEffect(() => {
    if (!HAS_SUPABASE) return; // demo mode: leave claims null → both lenses shown
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setClaims(readOrgClaims(data.user));
    });
    return () => {
      active = false;
    };
  }, []);

  const workspaces = entitledWorkspaces(claims);
  // The switcher renders nothing when a user has only one workspace (doc 04 §1.2).
  if (workspaces.length <= 1) return null;

  const onTeams = pathname === "/teams" || pathname.startsWith("/teams/");

  return (
    <div
      // Borderless segmented control on the dark navy topbar (DESIGN-SYSTEM.md §6):
      // a translucent white track; active = solid white pill with navy label
      // (inverted), inactive = muted white.
      className="flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5"
      role="navigation"
      aria-label="Workspace"
    >
      {workspaces.map(({ key, label, href, external, icon: Icon }) => {
        const active = !external && (key === "teams" ? onTeams : !onTeams);
        const className = cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150",
          active
            ? "bg-white text-[#1E3A5F]"
            : "text-white/70 hover:bg-white/10 hover:text-white",
        );
        const style = undefined;
        return external ? (
          <a key={key} href={href} className={className} style={style}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </a>
        ) : (
          <Link key={key} href={href} className={className} style={style}>
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
