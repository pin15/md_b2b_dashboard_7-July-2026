import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Clock, Lock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";

export function KpiCard({
  title,
  value,
  unit,
  delta,
  suppressed = false,
  pendingNote,
  alert = false,
  footer,
}: {
  title: string;
  value: number | null;
  unit?: string;
  delta?: number | null;
  suppressed?: boolean;
  pendingNote?: string;
  alert?: boolean;
  footer?: ReactNode;
}) {
  const body = () => {
    if (suppressed || (value === null && !pendingNote)) return <Placeholder kind="suppressed" />;
    if (value === null) return <Placeholder kind="pending" note={pendingNote} />;
    return (
      <div className="flex items-baseline gap-1">
        <span
          className="text-4xl font-semibold tabular-nums"
          style={alert ? { color: "var(--severity-red)" } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-lg text-brand-muted">{unit}</span>}
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      <div className="flex flex-1 flex-col justify-center">{body()}</div>
      {typeof delta === "number" && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: delta >= 0 ? "var(--severity-green)" : "var(--severity-coral)" }}
        >
          {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {delta >= 0 ? "+" : ""}
          {delta} pts vs prior quarter
        </div>
      )}
      {footer && <div className="text-xs text-brand-muted">{footer}</div>}
    </Card>
  );
}

function Placeholder({ kind, note }: { kind: "pending" | "suppressed"; note?: string }) {
  const pending = kind === "pending";
  const Icon = pending ? Clock : Lock;
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <span className="text-4xl font-semibold leading-none text-slate-300">—</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
        <Icon className="h-3 w-3" />
        {pending ? "Pending" : "Below threshold"}
      </span>
      <span className="max-w-[190px] text-[11px] leading-snug text-brand-muted">
        {pending ? note : "Cohort under 5 — suppressed for anonymity"}
      </span>
    </div>
  );
}
