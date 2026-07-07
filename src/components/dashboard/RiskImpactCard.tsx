"use client";

import { Card, CardTitle, Badge, Skeleton, CardError, StatusDot } from "@/components/ui/primitives";
import {
  useOrgRating,
  useRecoveryYield,
  useDecisionCost,
  useValidityTier,
  useOrgBenchmarkDelta,
  useOrgSectorPack,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { ShieldAlert, HeartPulse, Scale, ArrowRight } from "lucide-react";
import type { DecisionCostRow } from "@/lib/graphql/types";

/**
 * Risk & Impact card (WAVE-4 G4) — surfaces four Ashu-deck WAVE-3 employer
 * metrics, all aggregate-only (k≥5 IN-DB) wrappers over Privacy-Kernel RPCs:
 *
 *  • Org Rating (b2b_314) — psychosocial-hazard / insurer index (0-100, higher =
 *    worse) on the calm green→amber→coral band. Reads blank (never an invented
 *    score) when too few ISO-45003 constructs are configured (`suppressed`).
 *  • Recovery Yield (b2b_314) — reliable clinical improvements (RCI) per 1,000
 *    covered lives, trailing-12m. Count reads blank when the cohort is below k.
 *  • Decision Cost Ledger (b2b_309) — cohort OWI delta attributed to each
 *    leadership decision (95% CI). Below-k rows render suppressed.
 *
 *  The Tiered-Validity gate (b2b_305) frames the whole card: when the period's
 *  participation tier is NOT 'full' (`benchmarksVisible=false`), the dashboard
 *  SUPPRESSES any benchmark/peer comparison — the metrics still show their own
 *  org values, but no "vs peer" delta is rendered. A diagnosis-tier org sees the
 *  Participation-Diagnosis billable note instead.
 */

const BAND_COLOR: Record<string, string> = {
  green: SEVERITY.green,
  amber: SEVERITY.amber,
  coral: SEVERITY.coral,
};

function ratingTone(band: string | null): string {
  return (band && BAND_COLOR[band]) ?? SEVERITY.suppressed;
}

export function RiskImpactCard({ period }: { period: string }) {
  const rating = useOrgRating(period);
  const yield_ = useRecoveryYield();
  const decisions = useDecisionCost();
  const validity = useValidityTier(period);
  const benchmark = useOrgBenchmarkDelta("OWI", period);
  const sector = useOrgSectorPack();

  if (rating.isLoading || yield_.isLoading || decisions.isLoading)
    return <Skeleton className="h-72 w-full rounded-xl" />;
  if (rating.isError || yield_.isError || decisions.isError || validity.isError) return <CardError className="h-72" />;

  // Tiered-validity gate — full tier alone publishes confident benchmark deltas.
  const benchmarksVisible = validity.data?.benchmarksVisible ?? false;
  const tier = validity.data?.tier ?? null;
  const r = rating.data;
  const y = yield_.data;
  const rows: DecisionCostRow[] = decisions.data?.decisions ?? [];

  return (
    <div className="space-y-4">
      {/* ── Tiered-validity framing strip ─────────────────────────────────── */}
      {validity.data && validity.data.status === "ok" && (
        <Card className="flex flex-wrap items-center justify-between gap-2 py-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-brand-muted" />
            <span className="text-sm text-brand-text">
              Participation validity:{" "}
              <span className="font-medium">{tier ?? "—"}</span>
              {validity.data.participationPct != null && (
                <span className="text-brand-muted">
                  {" "}
                  · {validity.data.participationPct}% completed
                </span>
              )}
            </span>
          </div>
          {benchmarksVisible && benchmark.data?.benchmarksVisible ? (
            <span className="text-[11px] text-brand-muted">
              vs peers (n={benchmark.data.nOrgs}): median {benchmark.data.p50}
              {benchmark.data.position && ` · you're ${benchmark.data.position.replace(/_/g, " ")}`}
            </span>
          ) : benchmarksVisible ? (
            <span className="text-[11px] text-brand-muted">benchmarks unlocked — peer cell still below floor</span>
          ) : (
            <span className="text-[11px] text-brand-muted">
              {tier === "diagnosis"
                ? "below validity floor — Participation Diagnosis (benchmarks withheld)"
                : "directional only — peer benchmarks suppressed"}
            </span>
          )}
        </Card>
      )}

      {/* ── Sector framing (the org's assigned sector pack) ─────────────────── */}
      {sector.data?.assigned && (
        <Card className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
          <span className="text-sm text-brand-text">
            Sector framing: <span className="font-medium">{sector.data.name}</span>
          </span>
          {sector.data.kpiOverlays.slice(0, 3).map((o) => (
            <Badge key={o.metricKey ?? o.label ?? ""}>{o.label}</Badge>
          ))}
        </Card>
      )}

      {/* ── Org Rating + Recovery Yield ───────────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-brand-muted" />
              <CardTitle>Org Rating</CardTitle>
            </div>
            {r?.k != null && <span className="text-[11px] text-brand-muted">k≥{r.k}</span>}
          </div>
          <p className="text-[11px] text-brand-muted">
            Psychosocial-hazard / insurer index (0-100, higher = more hazard) over the
            configured {r?.standard ?? "ISO 45003 / PRA"} constructs. Reads blank until
            enough constructs are configured — never a fabricated score.
          </p>
          {!r || r.suppressed || r.hazardIndex == null ? (
            <p className="text-sm text-brand-muted">
              {r?.reason === "insufficient_constructs"
                ? `Coverage too thin to rate (${r?.constructsPresent ?? 0}/${r?.constructsConfigured ?? 0} constructs).`
                : "Not yet ratable for this period."}
            </p>
          ) : (
            <div className="flex items-baseline gap-3">
              <span
                className="text-4xl font-semibold tabular-nums"
                style={{ color: ratingTone(r.band) }}
              >
                {r.hazardIndex}
              </span>
              {r.band && (
                <span
                  className="rounded-full px-2 py-0.5 text-xs font-semibold capitalize"
                  style={{
                    color: ratingTone(r.band),
                    backgroundColor: `color-mix(in srgb, ${ratingTone(r.band)} 12%, white)`,
                  }}
                >
                  {r.band}
                </span>
              )}
              <span className="ml-auto text-[11px] text-brand-muted">
                {r.constructsPresent}/{r.constructsConfigured} constructs
                {r.coverage != null && ` · ${Math.round(r.coverage * 100)}% coverage`}
              </span>
            </div>
          )}
        </Card>

        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <HeartPulse className="h-4 w-4 text-brand-muted" />
              <CardTitle>Recovery Yield</CardTitle>
            </div>
            {y?.k != null && <span className="text-[11px] text-brand-muted">k≥{y.k}</span>}
          </div>
          <p className="text-[11px] text-brand-muted">
            Reliable clinical improvements (RCI) per 1,000 covered lives,{" "}
            {y?.window ?? "trailing 12m"}. The improving-cohort count reads blank when
            below the privacy floor.
          </p>
          {!y || y.suppressed || y.recoveryYieldPer1000 == null ? (
            <p className="text-sm text-brand-muted">
              {y && y.coveredLives != null
                ? `Below threshold across ${y.coveredLives} covered lives — yield withheld.`
                : "No covered-lives cohort yet."}
            </p>
          ) : (
            <div className="flex items-baseline gap-2">
              <span
                className="text-4xl font-semibold tabular-nums"
                style={{ color: SEVERITY.green }}
              >
                {y.recoveryYieldPer1000}
              </span>
              <span className="text-sm text-brand-muted">/ 1,000 lives</span>
              <span className="ml-auto text-[11px] text-brand-muted">
                {y.reliableImprovements ?? "—"} reliable · {y.coveredLives ?? "—"} covered
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* ── Decision Cost Ledger ──────────────────────────────────────────── */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Scale className="h-4 w-4 text-brand-muted" />
          <CardTitle>Decision Cost Ledger</CardTitle>
        </div>
        <p className="text-[11px] text-brand-muted">
          The wellbeing delta (OWI points, 95% CI) attributed to each leadership
          decision — before vs after the affected cohort. Each below-k row is suppressed
          (delta withheld); confounders are noted, not hidden.
        </p>
        {rows.length === 0 ? (
          <p className="text-sm text-brand-muted">
            No leadership decisions logged with a measurable cohort window yet.
          </p>
        ) : (
          <div className="space-y-2">
            {rows.map((d) => (
              <DecisionRow key={d.id ?? d.decisionKey ?? d.title} row={d} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function DecisionRow({ row: d }: { row: DecisionCostRow }) {
  const suppressed = d.suppressed || d.owiDelta == null;
  // OWI is higher-is-better, so a negative attributed delta is the costly direction.
  const tone =
    d.owiDelta == null
      ? SEVERITY.suppressed
      : d.owiDelta < 0
        ? SEVERITY.red
        : SEVERITY.green;
  const sign = d.owiDelta != null && d.owiDelta > 0 ? "+" : "";
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-brand-bg p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-brand-text">
          <StatusDot color={tone} />
          {d.title ?? d.decisionKey ?? "Decision"}
        </span>
        <div className="flex items-center gap-2">
          {d.decisionType && <Badge>{d.decisionType}</Badge>}
          {d.evidenceGrade && (
            <span className="text-[11px] text-brand-muted">grade {d.evidenceGrade}</span>
          )}
        </div>
      </div>
      {suppressed ? (
        <span className="text-sm text-brand-muted">
          Cohort below threshold — attributed cost withheld
          {d.nPost != null && ` (n=${d.nPost})`}.
        </span>
      ) : (
        <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums text-brand-text">
          <span className="text-brand-muted">{d.preOwi ?? "—"}</span>
          <ArrowRight className="h-3.5 w-3.5 text-brand-muted" />
          <span className="font-medium">{d.postOwi ?? "—"}</span>
          <span
            className="rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ color: tone, backgroundColor: `color-mix(in srgb, ${tone} 12%, white)` }}
          >
            {`${sign}${d.owiDelta} OWI`}
          </span>
          {d.ciLow != null && d.ciHigh != null && (
            <span className="text-[11px] text-brand-muted">
              95% CI [{d.ciLow}, {d.ciHigh}]
            </span>
          )}
          <span className="ml-auto text-[11px] text-brand-muted">
            {d.prePeriod ?? "—"} → {d.postPeriod ?? "—"} · n={d.nPost ?? "—"}
          </span>
        </div>
      )}
      {d.confounderNote && (
        <span className="text-[11px] text-brand-muted">{d.confounderNote}</span>
      )}
    </div>
  );
}
