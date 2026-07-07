"use client";

import { Card, CardTitle, Badge, Skeleton, CardError, StatusDot } from "@/components/ui/primitives";
import {
  useOrgCostPerOutcome,
  useOrgUnderperformingInterventions,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Receipt, TrendingDown, ArrowRight } from "lucide-react";
import type {
  CostPerOutcomeRow,
  UnderperformingInterventionRow,
} from "@/lib/graphql/types";

/**
 * Proof engine (b2b_283) — the two "proof-not-promises" receipts of the VERIFY beat.
 * Both are employer-guarded, aggregate-only (k≥5 IN-DB) wrappers over the Privacy
 * Kernel: a cost-per-outcome receipt per booked programme, and the retire signal for
 * programmes whose verified movement did not clear the effect floor.
 *
 *  • Cost per outcome — cost ÷ reliable verified improvements. `costPerOutcome` is
 *    NULL (honest blank, never a fabricated number) when the attributed-outcome
 *    cohort is below k (suppressed) OR no cost/outcome exists yet.
 *  • Underperforming interventions — programmes whose QoQ verified delta regressed,
 *    was flat, or improved below the floor; each row already rides a k≥5-both-quarters
 *    ledger reading. Empty is GOOD news (nothing to retire).
 */

// Currency receipts render with the RPC's own currency; default group-by locale.
function fmtMoney(v: number | null, currency: string): string {
  if (v == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${currency} ${Math.round(v).toLocaleString()}`;
  }
}

// retire-signal tone: regressed = red alert; flat/below-floor = calm coral.
function retireTone(direction: string | null): string {
  return direction === "regressed" ? SEVERITY.red : SEVERITY.coral;
}

export function ProofEngineCard({ period }: { period: string }) {
  const cost = useOrgCostPerOutcome(period);
  const underperf = useOrgUnderperformingInterventions();

  if (cost.isLoading || underperf.isLoading)
    return <Skeleton className="h-56 w-full rounded-xl" />;
  if (cost.isError || underperf.isError) return <CardError className="h-56" />;

  const costRows: CostPerOutcomeRow[] = cost.data?.rows ?? [];
  const flagRows: UnderperformingInterventionRow[] = underperf.data?.rows ?? [];

  return (
    <div className="space-y-4">
      {/* ── Cost per outcome ─────────────────────────────────────────────── */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-brand-muted" />
            <CardTitle>Cost per outcome</CardTitle>
          </div>
          {cost.data?.privacyK != null && (
            <span className="text-[11px] text-brand-muted">k≥{cost.data.privacyK}</span>
          )}
        </div>

        <p className="text-[11px] text-brand-muted">
          What one verified, reliable improvement actually costs — the programme&apos;s
          period cost divided by its k-safe verified improvements. A receipt reads blank
          (never an invented figure) until both a cost and a reliable outcome exist.
        </p>

        {costRows.length === 0 ? (
          <p className="text-sm text-brand-muted">
            No booked programmes attributed to a verified outcome this period yet.
          </p>
        ) : (
          <div className="space-y-2">
            {costRows.map((r) => (
              <CostRow key={r.interventionId ?? `${r.catalogueKey}:${r.grain}`} row={r} />
            ))}
          </div>
        )}
      </Card>

      {/* ── Underperforming interventions (retire signal) ────────────────── */}
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-brand-muted" />
            <CardTitle>Underperforming interventions</CardTitle>
          </div>
          {underperf.data?.effectFloorPoints != null && (
            <span className="text-[11px] text-brand-muted">
              floor {underperf.data.effectFloorPoints} pt
            </span>
          )}
        </div>

        <p className="text-[11px] text-brand-muted">
          The retire signal — booked programmes whose verified quarter-over-quarter
          movement regressed, was flat, or improved below the effect floor. Each row is a
          real k≥5-on-both-quarters ledger reading. An empty list is the good outcome.
        </p>

        {flagRows.length === 0 ? (
          <p className="text-sm text-brand-muted">
            No programme is below the retire threshold — every booked play is holding its
            verified effect (or is too early to read).
          </p>
        ) : (
          <div className="space-y-2">
            {flagRows.map((r) => (
              <RetireRow
                key={r.interventionId ?? `${r.catalogueKey}:${r.period}`}
                row={r}
              />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function CostRow({ row: r }: { row: CostPerOutcomeRow }) {
  const suppressed = r.suppressed || r.costPerOutcome == null;
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-brand-bg p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-brand-text">
          {r.interventionName ?? r.catalogueKey ?? "Programme"}
        </span>
        <span className="text-xs text-brand-muted">· {r.cohortLabel ?? r.grain}</span>
      </div>
      <div className="flex flex-wrap items-baseline gap-3">
        {suppressed ? (
          <span className="text-sm text-brand-muted">
            {r.suppressed
              ? r.suppressionReason ?? "below threshold (k)"
              : r.costAmount == null
                ? "cost not entered yet"
                : "no verified outcome yet"}
          </span>
        ) : (
          <span
            className="text-2xl font-semibold tabular-nums"
            style={{ color: SEVERITY.green }}
          >
            {fmtMoney(r.costPerOutcome, r.currency)}
            <span className="ml-1 text-xs font-normal text-brand-muted">/ outcome</span>
          </span>
        )}
        <span className="ml-auto text-[11px] text-brand-muted">
          {r.reliableOutcomes ?? 0} verified · {r.metricLabel ?? r.targetMetricKey}
        </span>
      </div>
      {r.ciBasis && (
        <span className="text-[10px] text-brand-muted">{r.ciBasis}</span>
      )}
    </div>
  );
}

function RetireRow({ row: r }: { row: UnderperformingInterventionRow }) {
  const tone = retireTone(r.direction);
  const sign = r.delta != null && r.delta > 0 ? "+" : "";
  return (
    <div className="flex flex-col gap-1 rounded-lg bg-brand-bg p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium text-brand-text">
          <StatusDot color={tone} />
          {r.metricLabel ?? r.targetMetricKey ?? "Programme"}
        </span>
        <div className="flex items-center gap-2">
          {r.status && <Badge>{r.status}</Badge>}
          {r.period && <span className="text-[11px] text-brand-muted">{r.period}</span>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm tabular-nums text-brand-text">
        <span className="text-brand-muted">{r.beforeValue ?? "—"}</span>
        <ArrowRight className="h-3.5 w-3.5 text-brand-muted" />
        <span className="font-medium">{r.afterValue ?? "—"}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ color: tone, backgroundColor: `color-mix(in srgb, ${tone} 12%, white)` }}
        >
          {r.delta == null ? "—" : `${sign}${r.delta} pts`} · {r.direction ?? "—"}
        </span>
        <span className="ml-auto text-[11px] text-brand-muted">n={r.n ?? "—"}</span>
      </div>
      {r.signal && <span className="text-[11px] text-brand-muted">{r.signal}</span>}
      {r.recommendation && (
        <span className="text-[11px]" style={{ color: tone }}>
          {r.recommendation}
        </span>
      )}
    </div>
  );
}
