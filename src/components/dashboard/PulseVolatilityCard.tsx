"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Waves } from "lucide-react";

/**
 * Pulse Volatility (KRI, WS-O O1, b2b_278). Standard deviation of the monthly
 * cohort-mean pulse across months (each month k≥5) — an instability / churn
 * signal. Longitudinal: abstains (pending) until ≥2 qualifying months exist.
 * Generic metricCells (ORG). CALM gradient only.
 */

// pulse_volatility_band: SD, lower=more stable=better. green ≤5 / amber ≤10 / coral >10.
function tone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 10) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function PulseVolatilityCard({ period }: { period: string }) {
  const org = useMetricCells("PULSE_VOLATILITY", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Waves className="h-4 w-4 text-brand-muted" />
        <CardTitle>Pulse Volatility</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          Pending — appears after ≥2 monthly pulses (each with at least 5 responders).
          A dynamic risk signal: shown honestly once there is enough history.
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v}
          </span>
          <span className="text-sm text-brand-muted">
            SD across months · n={cell!.n}
            {cell!.lowConfidence ? " · low confidence" : ""}
          </span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Month-to-month swing in the cohort pulse — lower is steadier; high volatility flags
        churn/instability worth a look. Aggregate only, k≥5. steady ≤5.
      </p>
    </Card>
  );
}
