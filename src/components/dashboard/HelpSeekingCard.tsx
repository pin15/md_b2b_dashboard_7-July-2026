"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Clock } from "lucide-react";

/**
 * WS-O O3 — Help-Seeking latency + conversion (doc 10 §2.3 / help_seeking pair).
 * The "months → weeks" story: how fast a risk flag turns into care (latency, DAYS,
 * lower=better) and what share of flagged members actually engage (conversion %,
 * higher=better). They are each other's anti-Goodhart guardrail pair (§3) — you
 * cannot shrink latency by narrowing the flag set without dropping conversion.
 *
 * Both via the generic metricCells (ORG grain), k≥5 in-DB. CALM gradient only —
 * these are continuous values, never red (doc 10 §2.1).
 */

// help_seeking_latency_band: days, lower=better (green≤14 / amber≤42 / coral>42).
function latencyTone(d: number): string {
  if (d <= 14) return SEVERITY.green;
  if (d <= 42) return SEVERITY.amber;
  return SEVERITY.coral;
}
// conversion %: higher=better (calm gradient; green≥70 / amber≥40 / coral<40).
function convTone(p: number): string {
  if (p >= 70) return SEVERITY.green;
  if (p >= 40) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function HelpSeekingCard({ period }: { period: string }) {
  const latency = useMetricCells("HELP_SEEKING_LATENCY", "ORG", period);
  const conversion = useMetricCells("HELP_SEEKING_CONVERSION", "ORG", period);

  if (latency.isLoading || conversion.isLoading)
    return <Skeleton className="h-40 w-full rounded-xl" />;
  if (latency.isError || conversion.isError) return <CardError className="h-40" />;

  const lat = latency.data?.[0];
  const conv = conversion.data?.[0];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-brand-muted" />
        <CardTitle>Help-seeking — flag to care</CardTitle>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Stat
          label="Time to care"
          unit="days"
          cell={lat}
          toneOf={latencyTone}
          empty="needs flag→care data"
        />
        <Stat
          label="Conversion"
          unit="%"
          cell={conv}
          toneOf={convTone}
          empty="needs flag→care data"
        />
      </div>

      <p className="text-[11px] text-brand-muted">
        Median days from a risk flag to engaging care, and the share of flagged members who
        engage. Paired guardrails — speed without coverage is not progress.
      </p>
    </Card>
  );
}

function Stat({
  label,
  unit,
  cell,
  toneOf,
  empty,
}: {
  label: string;
  unit: string;
  cell?: { value: number | null; suppressed: boolean; n: number } | undefined;
  toneOf: (v: number) => string;
  empty: string;
}) {
  const suppressed = !cell || cell.suppressed || cell.value == null;
  return (
    <div className="rounded-lg bg-brand-bg p-3">
      <div className="text-xs text-brand-muted">{label}</div>
      {suppressed ? (
        <div className="mt-1 text-sm text-brand-muted">
          {cell && cell.suppressed ? "below threshold (k<5)" : `pending — ${empty}`}
        </div>
      ) : (
        <div className="mt-1 flex items-baseline gap-1">
          <span
            className="text-3xl font-semibold tabular-nums"
            style={{ color: toneOf(cell!.value as number) }}
          >
            {cell!.value}
          </span>
          <span className="text-sm text-brand-muted">{unit}</span>
          <span className="ml-auto text-[10px] text-brand-muted">n={cell!.n}</span>
        </div>
      )}
    </div>
  );
}
