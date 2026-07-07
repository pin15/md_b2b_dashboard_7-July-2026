"use client";

import { useMetricCells, useFilterOptions } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { SEVERITY, gradientColor } from "@/lib/severity";
import type { MetricCell, MetricKey } from "@/lib/graphql/types";

/**
 * Department × metric heatmap (doc 04 §L3 / doc 10 §4). Reuses the per-department
 * aggregate cells (participation / validity / trust). Continuous values → calm
 * gradient (green→amber→coral, NEVER red). Sub-k cells render "below threshold".
 */
const COLS: { key: MetricKey; label: string }[] = [
  { key: "PARTICIPATION_PCT", label: "Participation" },
  { key: "RESPONSE_VALIDITY_RATE", label: "Validity" },
  { key: "TRUST_QUOTIENT", label: "Trust" },
];

export function DepartmentHeatmap({ period }: { period: string }) {
  const part = useMetricCells("PARTICIPATION_PCT", "DEPARTMENT", period);
  const valid = useMetricCells("RESPONSE_VALIDITY_RATE", "DEPARTMENT", period);
  const trust = useMetricCells("TRUST_QUOTIENT", "DEPARTMENT", period);
  const filters = useFilterOptions();

  const loading = part.isLoading || valid.isLoading || trust.isLoading || filters.isLoading;
  if (loading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (part.isError || valid.isError || trust.isError || filters.isError) return <CardError className="h-48" />;

  const byMetric: Record<string, Map<string, MetricCell>> = {
    PARTICIPATION_PCT: index(part.data),
    RESPONSE_VALIDITY_RATE: index(valid.data),
    TRUST_QUOTIENT: index(trust.data),
  };
  const deptName = new Map((filters.data?.departments ?? []).map((d) => [d.id, d.label]));
  // departments = union of dept ids seen across the three metrics
  const deptIds = Array.from(
    new Set(
      [part.data, valid.data, trust.data]
        .flatMap((cells) => (cells ?? []).map((c) => c.grainRef))
        .filter((x): x is string => !!x),
    ),
  );

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <CardTitle>Department Heatmap</CardTitle>
        <span className="text-xs text-brand-muted">calm gradient · k≥5 · sub-k below threshold</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-brand-muted">
              <th className="py-2 pr-3 font-medium">Department</th>
              {COLS.map((c) => (
                <th key={c.key} className="px-2 py-2 text-center font-medium">{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deptIds.map((id) => (
              <tr key={id} className="border-t border-black/5">
                <td className="py-2 pr-3 text-brand-text">{deptName.get(id) ?? id.slice(0, 8)}</td>
                {COLS.map((c) => (
                  <td key={c.key} className="px-2 py-1.5 text-center">
                    <HeatCell cell={byMetric[c.key]?.get(id)} />
                  </td>
                ))}
              </tr>
            ))}
            {deptIds.length === 0 && (
              <tr>
                <td colSpan={COLS.length + 1} className="py-6 text-center text-brand-muted">
                  No department cells for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function index(cells?: MetricCell[]): Map<string, MetricCell> {
  return new Map((cells ?? []).filter((c) => c.grainRef).map((c) => [c.grainRef as string, c]));
}

function HeatCell({ cell }: { cell?: MetricCell }) {
  if (!cell || cell.suppressed || cell.value == null) {
    return (
      <span
        className="inline-block min-w-[3.5rem] rounded-md px-2 py-1 text-xs"
        style={{ backgroundColor: "color-mix(in srgb, var(--severity-suppressed) 30%, white)", color: "#6b7280" }}
        title="below reporting threshold (n<5)"
      >
        —
      </span>
    );
  }
  const color = gradientColor(cell.value, true); // higher = better for all three
  return (
    <span
      className="inline-block min-w-[3.5rem] rounded-md px-2 py-1 text-xs font-medium tabular-nums"
      style={{ backgroundColor: `color-mix(in srgb, ${color} 22%, white)`, color }}
    >
      {cell.value.toFixed(0)}
    </span>
  );
}
