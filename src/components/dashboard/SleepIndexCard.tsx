"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Moon } from "lucide-react";

/**
 * Sleep Index (KHI, b2b_277). Cohort sleep health from the Insomnia Severity Index
 * (ISI), normalised to 0–100 favourability (higher = better sleep). Generic
 * metricCells (ORG grain), k≥5 in-DB. CALM gradient only (never red).
 */

// favourability band, higher=better: thriving ≥75 / steady ≥50 / strained <50.
function tone(v: number): string {
  if (v >= 75) return SEVERITY.green;
  if (v >= 50) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function SleepIndexCard({ period }: { period: string }) {
  const org = useMetricCells("SLEEP_INDEX", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Moon className="h-4 w-4 text-brand-muted" />
        <CardTitle>Sleep Index</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 responders before an index is shown."
            : "Pending — appears once the ISI sleep module is administered (governed wellbeing metric)."}
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v}
          </span>
          <span className="text-sm text-brand-muted">/100 · n={cell!.n}</span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Cohort sleep health (Insomnia Severity Index → 0–100 favourability, higher = better
        sleep). Aggregate only, k≥5. thriving ≥75 · steady ≥50.
      </p>
    </Card>
  );
}
