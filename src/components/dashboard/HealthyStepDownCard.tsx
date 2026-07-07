"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { TrendingDown } from "lucide-react";

/**
 * WS-O O6 — Healthy Step-Down Rate (doc 10 §3/§5 / engagement_stepdown pair). The
 * BRAKE on engagement/utilisation: of RECOVERED members, the share DE-ESCALATED
 * out of active care (vs retained in dependency). Higher=better. It closes the
 * anti-Goodhart loop — utilisation that never steps people down is dependency,
 * not recovery. Via the generic metricCells (ORG grain), k≥5 in-DB.
 *
 * CALM gradient only (continuous value, never red, doc 10 §2.1).
 */

// kci_band(70, 50), higher=better: green≥70 / amber≥50 / coral<50.
function tone(v: number): string {
  if (v >= 70) return SEVERITY.green;
  if (v >= 50) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function HealthyStepDownCard({ period }: { period: string }) {
  const org = useMetricCells("HEALTHY_STEP_DOWN_RATE", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <TrendingDown className="h-4 w-4 text-brand-muted" />
        <CardTitle>Healthy step-down rate</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 recovered members before a rate is shown."
            : "Pending — appears once recovered members have a step-down outcome (governed care metric)."}
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v}%
          </span>
          <span className="text-sm text-brand-muted">stepped down · n={cell!.n}</span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Of members who recovered, the share de-escalated out of active care. The brake on
        utilisation — recovery should lead to independence, not dependency. green ≥70%.
      </p>
    </Card>
  );
}
