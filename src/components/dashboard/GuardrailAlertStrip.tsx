"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useGuardrailViolations } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { ShieldCheck, AlertTriangle } from "lucide-react";

/**
 * WS-O O0/O6 — anti-Goodhart guardrail-violation strip (doc 10 §3/§5 / the VERIFY
 * beat). Reads detect_guardrail_violations: each pair where an accelerator improved
 * QoQ while its paired BRAKE degraded — a metric being gamed. Reads only k-safe
 * published snapshot cells across the two latest published snapshots (aggregate-only).
 *
 * A violation is a DISCRETE employer alert → red is permitted (doc 10 §2.1). Zero
 * violations is the healthy state → calm green. 'need_two_snapshots'/'no_snapshot'
 * → honest first-quarter framing (never a fabricated all-clear).
 */
export function GuardrailAlertStrip({ period }: { period: string }) {
  const q = useGuardrailViolations(period);
  const data = q.data;

  if (q.isLoading) return <Skeleton className="h-32 w-full rounded-xl" />;
  if (q.isError) return <CardError className="h-32" />;

  const status = data?.status ?? "no_org";
  const count = data?.violationCount ?? 0;

  if (status !== "computed") {
    return (
      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <CardTitle>Guardrail integrity</CardTitle>
          <Badge>starting point</Badge>
        </div>
        <p className="text-sm text-brand-muted">
          {status === "need_two_snapshots"
            ? "Guardrail checks compare two published quarters — they begin once a second quarter is published."
            : status === "no_snapshot"
              ? "No published snapshot yet — guardrail integrity appears after the first campaign closes."
              : "Pending."}
        </p>
      </Card>
    );
  }

  const clean = count === 0;

  // State is signalled by the icon + badge (below), never a colored bar/border
  // (DESIGN-SYSTEM.md §3). A violation is a discrete employer alert, so red is
  // permitted on those (doc 10 §2.1).
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {clean ? (
            <ShieldCheck className="h-4 w-4" style={{ color: SEVERITY.green }} />
          ) : (
            <AlertTriangle className="h-4 w-4" style={{ color: SEVERITY.red }} />
          )}
          <CardTitle>Guardrail integrity</CardTitle>
        </div>
        {clean ? (
          <Badge color={SEVERITY.green}>no violations</Badge>
        ) : (
          <Badge color={SEVERITY.red}>{count} needs attention</Badge>
        )}
      </div>

      <p className="text-xs text-brand-muted">
        {data?.periodPrev} → {data?.periodCurr} · every accelerator metric is checked against its
        paired brake. A violation = a metric improved while its brake degraded (possible gaming).
      </p>

      {clean ? (
        <p className="text-sm" style={{ color: SEVERITY.green }}>
          All metric pairs moved honestly — no accelerator improved at the expense of its brake.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {(data?.violations ?? []).map((v) => (
            <li
              key={`${v.group}:${v.accelerator}`}
              className="rounded-lg bg-brand-bg p-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wide text-brand-muted">
                  {v.group}
                </span>
                <span className="font-medium text-brand-text" style={{ color: SEVERITY.red }}>
                  {v.accelerator} ↑ vs {v.brake} ↓
                </span>
              </div>
              <p className="mt-1 text-xs text-brand-muted">{v.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
