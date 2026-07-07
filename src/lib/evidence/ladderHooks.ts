"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchEvidenceLadder } from "./ladder";

/**
 * Evidence-ladder hook (MIOS §9, b2b_310 — Task Z). Own file, isolated from K's
 * lib/evidence/hooks.ts. Reads get_org_evidence_ladder through the gateway; degrades to a
 * `pending` envelope until the gateway field is wired (see lib/evidence/ladder.ts).
 */
export function useEvidenceLadder(period: string | null) {
  return useQuery({
    queryKey: ["orgEvidenceLadder", period],
    queryFn: () => fetchEvidenceLadder(period),
  });
}
