"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Activity } from "lucide-react";

/**
 * Recovery Half-Life (KHI, WS-O O1, b2b_278). Periods from an OWI trough to halfway
 * recovery toward the pre-dip peak — resilience SPEED, not a count. Longitudinal:
 * abstains honestly (pending) until ≥3 OWI points with a completed dip→recovery
 * exist; never fabricated. Generic metricCells (ORG). CALM gradient only.
 */

// recovery_half_life_band: quarters, lower=faster=better. green ≤1 / amber ≤2 / coral >2.
function tone(v: number): string {
  if (v <= 1) return SEVERITY.green;
  if (v <= 2) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function RecoveryHalfLifeCard({ period }: { period: string }) {
  const org = useMetricCells("RECOVERY_HALF_LIFE", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-brand-muted" />
        <CardTitle>Recovery Half-Life</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          Pending — appears after ≥3 published quarters that contain a completed
          dip→recovery. A dynamic metric: shown honestly, never estimated early.
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v}
          </span>
          <span className="text-sm text-brand-muted">
            {v === 1 ? "quarter" : "quarters"} to bounce back
            {cell!.lowConfidence ? " · low confidence" : ""}
          </span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        How fast the org climbs back halfway from an OWI dip — resilience speed. Aggregate
        only, k≥5. faster ≤1 quarter.
      </p>
    </Card>
  );
}
