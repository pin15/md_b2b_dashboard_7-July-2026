"use client";

import { Card, CardTitle } from "@/components/ui/primitives";
import { SuppressedCell } from "@/components/dashboard/Privacy";
import { SEVERITY, gradientColor } from "@/lib/severity";
import type { MetricCell } from "@/lib/graphql/types";

/**
 * A heatmap-style grid of pre-materialised aggregate cells (e.g. MHSF by
 * department). Continuous values → calm gradient (green→amber→coral, never red).
 * Suppressed cells (n<5) render "below reporting threshold" — the value is null
 * server-side; we never reconstruct it.
 */
export function MetricCellGrid({
  title,
  cells,
  higherIsBetter,
  subtitle,
}: {
  title: string;
  cells: MetricCell[];
  higherIsBetter: boolean;
  subtitle?: string;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <CardTitle>{title}</CardTitle>
        {subtitle && <p className="mt-0.5 text-xs text-brand-muted">{subtitle}</p>}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {cells.map((c) => (
          <Tile key={`${c.grain}:${c.grainRef ?? "org"}`} cell={c} higherIsBetter={higherIsBetter} />
        ))}
      </div>
    </Card>
  );
}

function Tile({
  cell,
  higherIsBetter,
}: {
  cell: MetricCell;
  higherIsBetter: boolean;
}) {
  const suppressed = cell.suppressed || cell.value === null;
  const bg = suppressed
    ? SEVERITY.suppressed
    : `color-mix(in srgb, ${gradientColor(cell.value as number, higherIsBetter)} 22%, white)`;
  return (
    <div
      className="rounded-lg p-3"
      style={{ backgroundColor: bg }}
    >
      <div className="truncate text-xs text-brand-muted">
        {cell.grainLabel ?? "—"}
      </div>
      <div className="mt-1 text-lg font-semibold tabular-nums">
        {suppressed ? <SuppressedCell /> : cell.value}
      </div>
      <div className="text-[10px] text-brand-muted">n={cell.n}</div>
    </div>
  );
}
