"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY, owiBand } from "@/lib/severity";
import { CloudSun } from "lucide-react";

/**
 * MoodCast (KHI, WS-O O5, b2b_278). Honest next-quarter OWI forecast (last + trend
 * slope) with a low-confidence flag; abstains (pending) under 3 published quarters.
 * Never a fabricated point estimate. Generic metricCells (ORG). The forecast is an
 * OWI value, so it uses the OWI calm bands (≥70 green / ≥55 amber / <55 coral).
 */

export function MoodCastCard({ period }: { period: string }) {
  const org = useMetricCells("MOODCAST", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CloudSun className="h-4 w-4 text-brand-muted" />
          <CardTitle>MoodCast — next-quarter OWI</CardTitle>
        </div>
        {!suppressed && v != null && cell!.lowConfidence ? (
          <Badge>low confidence</Badge>
        ) : null}
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          Pending — a forecast appears only after ≥3 published quarters of OWI history.
          Shipped honestly with its confidence, never a fabricated point estimate.
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span
            className="text-4xl font-semibold tabular-nums"
            style={{ color: SEVERITY[owiBand(v)] }}
          >
            {v}
          </span>
          <span className="text-sm text-brand-muted">projected OWI · next quarter</span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Next quarter&apos;s Organisational Wellbeing Index, projected from the published
        trend. Honest-or-null: wide/withheld when history is thin. Aggregate only, k≥5.
      </p>
    </Card>
  );
}
