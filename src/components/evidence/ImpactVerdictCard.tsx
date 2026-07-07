"use client";

import { Scales } from "@phosphor-icons/react";
import { Card, CardHeading, Badge, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useImpactVerdict } from "@/lib/evidence/hooks";
import type { ImpactVerdict, ImpactVerdictRow } from "@/lib/evidence/api";

/**
 * Impact P&L verdict (MIOS §9, b2b_295) — the 4-state Scale / Fix / Hold / Retire call
 * per booked programme, over cost-per-outcome + effect size + trend. Every input rides
 * a k≥5 VERIFY-ledger row; the verdict ABSTAINS to "hold" without verified evidence, so
 * on the replica (no real spend, one published snapshot) every programme lands on hold —
 * that is the honest, correct state, not a bug.
 */

// scale = grow it (green), fix = needs work (navy — no amber/orange), hold = keep
// watching (neutral slate), retire = stop it (red, a discrete kill decision).
const VERDICT_TONE: Record<ImpactVerdict, string> = {
  scale: SEVERITY.green,
  fix: "var(--brand-primary)",
  hold: "var(--brand-muted)",
  retire: SEVERITY.red,
};

const VERDICT_LABEL: Record<ImpactVerdict, string> = {
  scale: "Scale",
  fix: "Fix",
  hold: "Hold",
  retire: "Retire",
};

function fmtMoney(v: number | null): string {
  if (v == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `INR ${Math.round(v).toLocaleString()}`;
  }
}

export function ImpactVerdictCard({
  period,
  productLine,
}: {
  period: string;
  productLine: string | null;
}) {
  const verdict = useImpactVerdict(period, productLine);

  if (verdict.isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;

  const pending = verdict.data?.pending ?? false;
  const rows: ImpactVerdictRow[] = verdict.data?.rows ?? [];

  return (
    <Card>
      <CardHeading
        icon={<Scales weight="duotone" className="h-5 w-5" />}
        title="Impact P&L — Scale / Fix / Hold / Retire"
        action={<Badge color="var(--brand-muted)">Per programme</Badge>}
      />

      {/* Verdict legend — teaches the four states even before a programme is graded. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {(["scale", "fix", "hold", "retire"] as ImpactVerdict[]).map((v) => (
          <Badge key={v} color={VERDICT_TONE[v]}>
            {VERDICT_LABEL[v]}
          </Badge>
        ))}
      </div>

      {pending ? (
        <p className="mt-4 text-sm text-brand-muted">
          The verdict engine is built ({" "}
          <code className="rounded bg-brand-bg px-1 text-xs">get_org_impact_verdict</code>{" "}
          ). The numbers appear once the gateway field is wired and a programme has a
          verified second-quarter movement to grade — never estimated.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-brand-muted">
          No booked programmes to grade in this product line yet. A verdict needs a
          booked programme and a verified before→after reading at k≥5.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-muted">
                <th className="py-1">Programme</th>
                <th className="py-1 text-right">Δ (verified)</th>
                <th className="py-1 text-right">Cost / outcome</th>
                <th className="py-1 text-right">Verdict</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.catalogueKey + (r.interventionId ?? "")}
                  className="border-t border-brand-border/60 align-top"
                >
                  <td className="py-2 text-brand-text">
                    {r.interventionName}
                    <div className="text-xs text-brand-muted">
                      {r.productLine ?? "—"} · {r.targetMetricKey ?? "—"}
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {r.delta == null
                      ? "—"
                      : `${r.delta > 0 ? "+" : ""}${r.delta}`}
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtMoney(r.costPerOutcome)}
                  </td>
                  <td className="py-2 text-right">
                    <Badge color={VERDICT_TONE[r.verdict]}>
                      {VERDICT_LABEL[r.verdict]}
                    </Badge>
                    <div className="mt-1 max-w-[16rem] text-right text-[11px] leading-tight text-brand-muted">
                      {r.verdictBasis}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-brand-muted">
        Aggregate-only (k≥5 in-DB). Verdict abstains to <b>Hold</b> without verified
        evidence; cost-per-outcome is blank, never fabricated, where a cohort is
        suppressed or no cost is booked.
      </p>
    </Card>
  );
}
