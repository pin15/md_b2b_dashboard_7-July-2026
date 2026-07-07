"use client";

import { useOrgObservedClimate } from "@/lib/hooks/useDashboardData";
import { WidgetShell, type UniversalState } from "@/components/dashboard/WidgetState";
import { Badge } from "@/components/ui/primitives";
import { gradientColor } from "@/lib/severity";

const CONSTRUCT_LABEL: Record<string, string> = {
  voice_equity: "Voice equity",
  blame: "Blame-free response",
  conflict_maturity: "Conflict maturity",
  decision_health: "Decision health",
};

/**
 * WS-U U6 FieldLens — the third measurement channel: trained observers, not self-
 * report. Reads ONLY get_org_observed_climate — per-construct mean observed code
 * (0–4) over κ≥0.70 RELIABLE sessions, each construct independently k-suppressed by
 * session count. NEVER an individual or a named team. Honest-or-pending: below the
 * reliable-session floor → suppressed. The 0–4 mean uses the calm gradient (never red).
 */
export function ObservedClimateCard() {
  const { data, isLoading } = useOrgObservedClimate();
  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Observed climate (FieldLens)" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <p className="text-xs text-brand-muted">
            {data.reliableSessions} reliable observation sessions (inter-rater κ≥0.70). Means on a 0–4 behavioural
            scale.
          </p>
          <div className="mt-3 space-y-2">
            {data.observed.map((c) => (
              <div key={c.constructCode} className="flex items-center justify-between text-sm">
                <span className="text-brand-text">{CONSTRUCT_LABEL[c.constructCode] ?? c.constructCode}</span>
                {c.status === "suppressed" || c.observedMean == null ? (
                  <Badge>below threshold</Badge>
                ) : (
                  <span
                    className="tabular-nums font-semibold"
                    style={{ color: gradientColor((c.observedMean / 4) * 100, true) }}
                  >
                    {c.observedMean.toFixed(1)} / 4
                  </span>
                )}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            Observed, not self-reported. Per-construct aggregates at k≥{data.k ?? 5} reliable sessions — never an
            individual or a named team.
          </p>
        </>
      )}
    </WidgetShell>
  );
}
