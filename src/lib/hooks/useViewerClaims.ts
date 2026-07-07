"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { HAS_SUPABASE } from "@/lib/env";
import { readOrgClaims, type OrgClaims } from "@/lib/auth/claims";

/**
 * Reads the viewer's verified JWT claims (org / role / seniority level) off the
 * Supabase session — zero DB queries (doc 02 §3). This is a UX gate only: the
 * authoritative wall is apps/api's AuthGuard + each RPC's in-DB scope check.
 *
 * In demo / mock mode (no Supabase) claims are null → callers should treat that
 * as "show everything" so the surface is exercisable without a live session
 * (same convention as WorkspaceSwitcher).
 */
export function useViewerClaims(): { claims: OrgClaims | null; loading: boolean } {
  const [claims, setClaims] = useState<OrgClaims | null>(null);
  const [loading, setLoading] = useState<boolean>(HAS_SUPABASE);

  useEffect(() => {
    if (!HAS_SUPABASE) {
      setLoading(false);
      return;
    }
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setClaims(readOrgClaims(data.user));
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { claims, loading };
}

/**
 * True when the viewer may see an `l3_only` surface (Manager Calibration). L3 =
 * senior leaders (CHRO / CEO / founders), per D4. In demo mode (claims null) we
 * permit it so the card is demoable; the API/RPC remains the real gate.
 */
export function useIsLeadership(): boolean {
  const { claims } = useViewerClaims();
  if (!HAS_SUPABASE) return true; // demo mode
  if (!claims) return false;
  return claims.seniorityLevel === "l3";
}
