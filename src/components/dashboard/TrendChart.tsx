"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useMetricTrend } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import type { MetricKey, TrendPoint } from "@/lib/graphql/types";

/**
 * Quarter-over-quarter trend (doc 04 / doc 10 §4). Org-grain, k≥5; suppressed
 * points are gaps (null), never reconstructed. Inactive metrics (e.g. OWI pending
 * sign-off) return no series. Calm palette — never red on a gradient line.
 */
const SERIES: { key: MetricKey; label: string; color: string }[] = [
  { key: "PARTICIPATION_PCT", label: "Participation", color: "var(--brand-primary)" },
  { key: "RESPONSE_VALIDITY_RATE", label: "Validity", color: SEVERITY.amber },
  { key: "TRUST_QUOTIENT", label: "Trust", color: SEVERITY.green },
];

export function TrendChart() {
  const part = useMetricTrend("PARTICIPATION_PCT");
  const valid = useMetricTrend("RESPONSE_VALIDITY_RATE");
  const trust = useMetricTrend("TRUST_QUOTIENT");

  if (part.isLoading || valid.isLoading || trust.isLoading)
    return <Skeleton className="h-64 w-full rounded-xl" />;
  if (part.isError || valid.isError || trust.isError) return <CardError className="h-64" />;

  // merge the three series by period
  const periods = Array.from(
    new Set(
      [part.data, valid.data, trust.data]
        .flatMap((s) => (s ?? []).map((p) => p.period)),
    ),
  ).sort();
  const idx = (s: TrendPoint[] | undefined) => new Map((s ?? []).map((p) => [p.period, p.value]));
  const mp = idx(part.data), mv = idx(valid.data), mt = idx(trust.data);
  const rows = periods.map((period) => ({
    period,
    PARTICIPATION_PCT: mp.get(period) ?? null,
    RESPONSE_VALIDITY_RATE: mv.get(period) ?? null,
    TRUST_QUOTIENT: mt.get(period) ?? null,
  }));

  if (rows.length < 2) {
    return (
      <Card>
        <CardTitle>Trends</CardTitle>
        <p className="mt-2 text-sm text-brand-muted">
          Need at least two published quarters to show a trend. One snapshot so far.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <CardTitle>Quarter-over-quarter trends</CardTitle>
        <span className="text-xs text-brand-muted">org-grain · k≥5 · suppressed points are gaps</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: "var(--brand-muted)" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--brand-muted)" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
