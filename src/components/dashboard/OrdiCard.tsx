"use client";

import { useQuery } from "@tanstack/react-query";
import { getOrgOrdi } from "@/lib/ordi/ordi";
import { WidgetShell, type UniversalState } from "@/components/dashboard/WidgetState";
import { Badge } from "@/components/ui/primitives";
import { gradientColor } from "@/lib/severity";

/**
 * WS-G ORDI — the FieldLens killer cell. Joins the REPORTED PSYCH_SAFETY favourability
 * (self-report, 0–100) against the OBSERVED κ≥0.70-reliable FieldLens behavioural cell
 * (0–4 → normalised 0–100), and surfaces the per-construct divergence delta. The danger
 * pattern — "reported-HIGH / observed-LOW" — is flagged in amber: the team SAYS it is
 * safe but its observed behaviour says otherwise. Reads ONLY get_org_ordi (b2b_291):
 * both inputs are already k≥5 / κ-reliable aggregates — NEVER an individual or a named
 * team. Honest-or-pending: reported unpublished → 'reported_pending'; too few reliable
 * sessions → 'observed_pending'; per-construct below threshold → 'suppressed'.
 */
export function OrdiCard() {
  const { data, isLoading } = useQuery({
    queryKey: ["orgOrdi"],
    queryFn: () => getOrgOrdi(null),
  });

  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  const computed = data?.cells.filter((c) => c.status === "computed") ?? [];

  return (
    <WidgetShell title="Observed–Reported Divergence (ORDI)" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-brand-muted">Reported psychological safety</span>
            <span
              className="tabular-nums font-semibold"
              style={{ color: gradientColor(data.reported?.value ?? 0, true) }}
            >
              {data.reported?.value?.toFixed(0)} / 100
            </span>
          </div>
          <p className="mt-1 text-xs text-brand-muted">
            vs {data.reliableSessions} κ≥0.70 reliable observation sessions. Δ = reported − observed (positive =
            says-safer-than-behaves).
          </p>

          <div className="mt-3 space-y-2">
            {computed.map((c) => (
              <div key={c.constructCode} className="flex items-center justify-between text-sm">
                <span className="text-brand-text">{c.constructName}</span>
                <span className="flex items-center gap-2">
                  <span
                    className="tabular-nums"
                    style={{ color: gradientColor(c.observedNorm ?? 0, true) }}
                    title="Observed (0–100)"
                  >
                    {c.observedNorm?.toFixed(0)}
                  </span>
                  <span
                    className="tabular-nums font-semibold"
                    style={{ color: gradientColor(100 - Math.abs(c.divergenceDelta ?? 0), true) }}
                    title="Divergence Δ"
                  >
                    Δ{(c.divergenceDelta ?? 0) > 0 ? "+" : ""}
                    {c.divergenceDelta?.toFixed(0)}
                  </span>
                  {c.reportedHighObservedLow && <Badge color="#d97706">says-safe / behaves-unsafe</Badge>}
                </span>
              </div>
            ))}
            {data.cells
              .filter((c) => c.status !== "computed")
              .map((c) => (
                <div key={c.constructCode} className="flex items-center justify-between text-sm">
                  <span className="text-brand-text">{c.constructName}</span>
                  <Badge>below threshold</Badge>
                </div>
              ))}
          </div>

          {data.anyReportedHighObservedLow && data.worstDivergenceConstruct && (
            <p className="mt-3 text-xs text-severity-amber">
              Largest gap: {computed.find((c) => c.constructCode === data.worstDivergenceConstruct)?.constructName} (Δ+
              {data.worstDivergenceDelta?.toFixed(0)}). Surveys read safe; observed behaviour does not — a candour gap.
            </p>
          )}
          <p className="mt-3 text-xs text-brand-muted">
            Both channels are k≥{data.k ?? 5} aggregates — never an individual or a named team.
          </p>
        </>
      )}
    </WidgetShell>
  );
}
