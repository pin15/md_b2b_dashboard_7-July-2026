import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Privacy rendering (Iron Rule v2 + doc §4). Render ONLY what the API returns.
 * A suppressed/null aggregate cell shows "below reporting threshold" — never a
 * fabricated number, never an individual value. The API returns
 * `suppressed:true, value:null`; we mirror that, we don't compute around it.
 */

export function SuppressedCell({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500",
        className,
      )}
      title="Cohort below the k≥5 reporting threshold — suppressed to protect anonymity."
    >
      <Lock className="h-3 w-3" />
      below reporting threshold
    </span>
  );
}

/**
 * A value that may be suppressed. If `suppressed` or value is null, shows the
 * lavender suppressed chip; otherwise renders `children` (the formatted value).
 */
export function MetricValue({
  suppressed,
  value,
  children,
}: {
  suppressed: boolean;
  value: number | null;
  children: ReactNode;
}) {
  if (suppressed || value === null) return <SuppressedCell />;
  return <>{children}</>;
}

/**
 * A "pending — not yet available" tile for metrics that are intentionally not
 * computed yet (e.g. burnout % pre-Wave-1, B3). Honest, never a placeholder
 * number. Distinct from suppression (which is a privacy floor).
 */
export function PendingTile({ note }: { note: string }) {
  return (
    <div className="rounded-md bg-brand-bg px-2.5 py-1 text-xs text-brand-muted">
      Pending · {note}
    </div>
  );
}
