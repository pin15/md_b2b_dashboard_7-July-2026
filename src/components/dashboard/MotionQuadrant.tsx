"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { Compass } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useOrgQuadrant } from "@/lib/hooks/useDashboardData";
import type { QuadrantPoint } from "@/lib/graphql/types";

/**
 * Stress × Engagement motion quadrant (doc 04 §2.3 Zone D). One point per cohort:
 * x = Stress (PSS-high%, higher = worse), y = Engagement (UWES, higher = better).
 * The four quadrants are Thriving / Coasting / Straining / Burning. Aggregate-only,
 * k≥5 — a cohort plots only when BOTH axes are known (the RPC drops half-known and
 * sub-k points). Today the source cells (PSS-high% + UWES) aren't computed yet, so
 * this renders its honest "building" state rather than a fabricated cloud.
 *
 * Calm ramp only (no red): point colour reflects the quadrant's severity.
 */

// Quadrant of a point: stress is x (↑=worse), engagement is y (↑=better).
function pointColor(p: QuadrantPoint): string {
  const stressed = (p.stress ?? 0) >= 50;
  const engaged = (p.engagement ?? 0) >= 50;
  if (!stressed && engaged) return SEVERITY.green; // Thriving
  if (stressed && engaged) return SEVERITY.amber; // Straining (engaged but stressed)
  if (!stressed && !engaged) return SEVERITY.amber; // Coasting (calm but disengaged)
  return SEVERITY.coral; // Burning (stressed + disengaged)
}

function QuadrantLabel({ x, y, text }: { x: string; y: string; text: string }) {
  return (
    <div
      className="pointer-events-none absolute text-[10px] font-medium uppercase tracking-wide text-brand-muted/70"
      style={{ [x]: 8, [y]: 8 } as React.CSSProperties}
    >
      {text}
    </div>
  );
}

export function MotionQuadrant({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgQuadrant(period, "DEPARTMENT");
  const points = data ?? [];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-brand-muted" />
        <CardTitle>Stress × Engagement</CardTitle>
        <span className="text-xs text-brand-muted">— by department, k≥5</span>
      </div>

      {isLoading ? (
        <div className="h-[320px] w-full animate-pulse rounded-xl bg-brand-border/40" />
      ) : isError ? (
        <p className="text-sm text-brand-muted">The quadrant is unavailable right now.</p>
      ) : points.length === 0 ? (
        <BuildingState />
      ) : (
        <div className="relative">
          <QuadrantLabel x="left" y="top" text="Burning" />
          <QuadrantLabel x="right" y="top" text="Straining" />
          <QuadrantLabel x="left" y="bottom" text="Coasting" />
          <QuadrantLabel x="right" y="bottom" text="Thriving" />
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
              <XAxis
                type="number"
                dataKey="stress"
                name="Stress"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                label={{ value: "Stress →", position: "bottom", fontSize: 11, fill: "var(--brand-muted)" }}
              />
              <YAxis
                type="number"
                dataKey="engagement"
                name="Engagement"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                label={{ value: "Engagement →", angle: -90, position: "left", fontSize: 11, fill: "var(--brand-muted)" }}
              />
              <ZAxis type="number" dataKey="n" range={[80, 360]} name="cohort size" />
              <ReferenceLine x={50} stroke="var(--brand-border)" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="var(--brand-border)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--brand-border)" }}
                formatter={(value: number, name: string) => [`${value}`, name]}
                labelFormatter={() => ""}
              />
              <Scatter data={points} isAnimationActive={false}>
                {points.map((p) => (
                  <Cell key={p.grainRef ?? p.label} fill={pointColor(p)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function BuildingState() {
  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-border bg-brand-bg/30 px-6 text-center">
      <Compass className="h-6 w-6 text-brand-muted" />
      <p className="max-w-sm text-sm font-medium text-brand-text">
        Building your Stress × Engagement map
      </p>
      <p className="max-w-md text-xs leading-relaxed text-brand-muted">
        Each department will plot here once two inputs are live at k≥5: perceived
        stress (PSS-10 high-stress share) and work engagement (UWES). A cohort
        appears only when both are known — we never guess a position.
      </p>
    </div>
  );
}
