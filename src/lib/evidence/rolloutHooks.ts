"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchRolloutContrast } from "./rollout";

/**
 * E3 rollout-contrast hook (MIOS §9 — wave-4 G2). Own file, isolated from K's
 * lib/evidence/hooks.ts and Z's ladderHooks.ts. Reads get_org_rollout_contrast through
 * the gateway for one programme; degrades to a `pending` envelope until the gateway field
 * is wired (see lib/evidence/rollout.ts). Disabled until a programme is selected so the
 * E3 drill is only fetched on demand.
 */
export function useRolloutContrast(programme: string | null, period: string | null) {
  return useQuery({
    queryKey: ["orgRolloutContrast", programme, period],
    queryFn: () => fetchRolloutContrast(programme as string, period),
    enabled: Boolean(programme),
  });
}
