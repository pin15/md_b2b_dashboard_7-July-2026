"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SuppressedCell } from "@/components/dashboard/Privacy";
import { SEVERITY, owiBand } from "@/lib/severity";

/**
 * OWI headline gauge — a continuous score, so it uses the CALM gradient
 * (green→amber→coral, NEVER red). Half-donut 0–100.
 */
export function OwiGauge({
  value,
  suppressed = false,
  pendingNote,
}: {
  value: number | null;
  suppressed?: boolean;
  pendingNote?: string;
}) {
  const pending = !suppressed && value === null;
  const body = () => {
    if (!suppressed && value !== null) return <Gauge value={value} />;
    if (suppressed) return <div className="flex h-[150px] items-center"><SuppressedCell /></div>;
    return <PendingGauge />;
  };
  return (
    <Card className="flex h-full flex-col items-center gap-1">
      <CardTitle>Wellness Score (OWI)</CardTitle>
      {body()}
      {pending && (
        <span className="max-w-[200px] text-center text-[11px] leading-snug text-brand-muted">
          {pendingNote ?? "not yet available"}
        </span>
      )}
      <p className="mt-auto pt-1 text-xs text-brand-muted">
        Green ≥ 70 · Amber 55–69 · Coral &lt; 55
      </p>
    </Card>
  );
}

function PendingGauge() {
  return (
    <div className="relative h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: 100 }]}
            dataKey="value"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="var(--brand-border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center gap-1">
        <span className="text-3xl font-semibold leading-none text-slate-300">—</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      </div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const color = SEVERITY[owiBand(value)];
  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value },
  ];
  return (
    <div className="relative h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="var(--brand-border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <span className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-brand-muted">/100</span>
      </div>
    </div>
  );
}
