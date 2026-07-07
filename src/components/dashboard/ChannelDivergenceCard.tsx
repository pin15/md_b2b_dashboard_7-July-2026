"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Scale } from "lucide-react";

/**
 * Channel Divergence (KTI, b2b_277). The trust-deficit gap: the IDENTIFIED channel
 * (quarterly battery, WHO-5 favourability) minus the ANONYMOUS channel (monthly
 * pulse favourability) for the same cohort. A large POSITIVE gap = "reported-high
 * (identified), felt-low (anonymous)" → people don't yet trust the named survey.
 * Generic metricCells (ORG), both channels k≥5 in-DB. CALM gradient only.
 */

// channel_divergence_band: identified − anonymous pts, lower=better (channels agree).
function tone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 15) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function ChannelDivergenceCard({ period }: { period: string }) {
  const org = useMetricCells("CHANNEL_DIVERGENCE_INDEX", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Scale className="h-4 w-4 text-brand-muted" />
        <CardTitle>Channel Divergence</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          {cell && cell.suppressed
            ? "Below the reporting threshold — both the battery and the pulse channel need at least 5 responders."
            : "Pending — appears once a quarterly battery and an anonymous pulse both run for the same cohort."}
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v > 0 ? `+${v}` : v}
          </span>
          <span className="text-sm text-brand-muted">pts gap · n={cell!.n}</span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Identified battery − anonymous pulse favourability. A large positive gap is a
        quantified trust deficit (reported-high, felt-low). Aggregate only, k≥5. agree ≤5 pts.
      </p>
    </Card>
  );
}
