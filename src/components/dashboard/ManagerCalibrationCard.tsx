"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { useIsLeadership } from "@/lib/hooks/useViewerClaims";
import { SEVERITY } from "@/lib/severity";
import { ShieldAlert, Lock } from "lucide-react";

/**
 * WS-O O2 — Manager Calibration (doc 10 §2.3 / risk_review forum). KRI,
 * visibility=l3_only: the median divergence between a manager's OWN OWI and their
 * team's k≥5 aggregate OWI — the "everything-is-fine manager" signal. Manager-
 * COHORT grain only (double k≥5: team side + manager cohort) — NEVER an individual
 * manager. Served by the generic metricCells (ORG/LEVEL grain).
 *
 * Gated to LEADERSHIP (l3) in the UI; the API/RPC publish-gate + is_active is the
 * real wall. Higher divergence = more risk → CALM gradient (green→amber→coral,
 * never red on this continuous value, doc 10 §2.1).
 */

// manager_calibration_band: OWI-pt divergence, positive=risk (green≤5/amber≤15/coral>15).
function tone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 15) return SEVERITY.amber;
  return SEVERITY.coral;
}
function label(v: number): string {
  if (v <= 5) return "well-calibrated";
  if (v <= 15) return "some drift";
  return "calibration gap";
}

export function ManagerCalibrationCard({ period }: { period: string }) {
  const isLeadership = useIsLeadership();
  // Always call the hook (rules of hooks); we simply don't render its data when
  // the viewer is not leadership.
  const org = useMetricCells("MANAGER_CALIBRATION", "ORG", period);

  if (!isLeadership) {
    return (
      <Card className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-brand-muted" />
          <CardTitle>Manager Calibration</CardTitle>
        </div>
        <p className="text-sm text-brand-muted">
          Leadership-only (L3). This calibration signal is restricted to senior leaders.
        </p>
      </Card>
    );
  }

  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-brand-muted" />
          <CardTitle>Manager Calibration</CardTitle>
        </div>
        <Badge>leadership only</Badge>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 managers (each with a k≥5 team) before a cohort number is shown."
            : "Pending — appears once a manager hierarchy is in place and the metric is published (governed risk metric)."}
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
              {v}
            </span>
            <span className="text-sm text-brand-muted">OWI-pt divergence · {label(v)}</span>
          </div>
          <div className="text-[11px] text-brand-muted">
            manager cohort n={cell!.n} · green ≤5 · amber ≤15 · coral &gt;15
          </div>
        </>
      )}

      <p className="text-[11px] text-brand-muted">
        Median gap between a manager&apos;s own wellbeing reading and their team&apos;s aggregate.
        Cohort-level only — never an individual manager.
      </p>
    </Card>
  );
}
