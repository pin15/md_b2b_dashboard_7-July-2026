"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchImpactVerdict, fetchRepeatLessonRate } from "./api";

/**
 * Evidence/Outcomes hooks (MIOS §9, b2b_295) — own files, isolated from the shared
 * dashboard hooks. The Impact-verdict + repeat-lesson-rate read the §9 RPCs through
 * the gateway; both degrade to a `pending` envelope until the gateway field is wired
 * (see lib/evidence/api.ts). The live proof spine (cost-per-outcome + retire signal)
 * reuses the already-wired shared hooks in the page, not duplicated here.
 */
export function useImpactVerdict(period: string, productLine: string | null) {
  return useQuery({
    queryKey: ["orgImpactVerdict", period, productLine],
    queryFn: () => fetchImpactVerdict(period, productLine),
  });
}

export function useRepeatLessonRate() {
  return useQuery({
    queryKey: ["orgRepeatLessonRate"],
    queryFn: fetchRepeatLessonRate,
  });
}
