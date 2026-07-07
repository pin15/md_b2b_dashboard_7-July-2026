"use client";

import { Steps } from "@phosphor-icons/react";
import { Card, CardHeading, Badge, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useEvidenceLadder } from "@/lib/evidence/ladderHooks";
import type { EvidenceLevel, EvidenceLadderRow } from "@/lib/evidence/ladder";

/**
 * Evidence-ladder panel (MIOS §9, b2b_310 — Task Z). The "how strong is the proof" view:
 * for each programme, the HIGHEST honestly-supported rung E0..E5 with its effect size and
 * 95% CI. It is the rigour companion to K's Impact P&L verdict card — the verdict says
 * Scale/Fix/Hold/Retire; this panel says how much you should TRUST that verdict, by
 * declaring the evidence design behind it.
 *
 *   E0 anecdote · E1 pre/post (Routine) · E2 matched comparison (Enhanced) ·
 *   E3 stepped-wedge treatment vs control (Gold, causal) · E4 pooled · E5 peer-reviewed
 *
 * Ladder-honest: the rung is never inflated above the design that produced it. Employer-
 * blind by construction (k≥5 programme-level aggregates, never a person). On the replica
 * every programme is E0 / null effect — one published snapshot, no sibling cohorts, no
 * randomised-order rollout arms — which is the honest, correct state, not a bug.
 *
 * This is an OWN component file; it does not rewrite K's ImpactVerdictCard or page.
 */

const LADDER: EvidenceLevel[] = ["e0", "e1", "e2", "e3", "e4", "e5"];

const LEVEL_LABEL: Record<EvidenceLevel, string> = {
  e0: "E0 · anecdote",
  e1: "E1 · pre/post",
  e2: "E2 · matched",
  e3: "E3 · wedge",
  e4: "E4 · pooled",
  e5: "E5 · peer-reviewed",
};

// Evidence-strength encoding: pre-causal rungs (E0–E2: anecdote / pre-post / matched)
// read NEUTRAL slate ("developing"); causal-and-above (E3 stepped-wedge → E5
// peer-reviewed) read GREEN ("proven"). No amber/coral/orange — the meaning is
// proven-vs-developing, which is clearer than six arbitrary hues (DESIGN-SYSTEM.md §4).
const LEVEL_TONE: Record<EvidenceLevel, string> = {
  e0: "var(--brand-muted)",
  e1: "var(--brand-muted)",
  e2: "var(--brand-muted)",
  e3: SEVERITY.green,
  e4: SEVERITY.green,
  e5: SEVERITY.green,
};

function fmtCi(row: EvidenceLadderRow): string {
  if (row.effectSize == null) return "—";
  const eff = `${row.effectSize > 0 ? "+" : ""}${row.effectSize}`;
  if (row.ciLower == null || row.ciUpper == null) return `${eff} (CI —)`;
  return `${eff} [${row.ciLower}, ${row.ciUpper}]`;
}

export function EvidenceLadderPanel({ period }: { period: string | null }) {
  const ladder = useEvidenceLadder(period);

  if (ladder.isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;

  const pending = ladder.data?.pending ?? false;
  const rows: EvidenceLadderRow[] = ladder.data?.rows ?? [];

  return (
    <Card>
      <CardHeading
        icon={<Steps weight="duotone" className="h-5 w-5" />}
        title="Evidence ladder — E0 to E5"
        action={<Badge color="var(--brand-muted)">Proof strength</Badge>}
      />

      {/* The ladder legend rail — always visible, so the panel teaches the scale even when empty. */}
      <div className="mt-4 flex flex-wrap gap-1.5">
        {LADDER.map((lvl) => (
          <Badge key={lvl} color={LEVEL_TONE[lvl]}>
            {LEVEL_LABEL[lvl]}
          </Badge>
        ))}
      </div>

      {pending ? (
        <p className="mt-4 text-sm text-brand-muted">
          The evidence-ladder engine is built ({" "}
          <code className="rounded bg-brand-bg px-1 text-xs">get_org_evidence_ladder</code>
          ,{" "}
          <code className="rounded bg-brand-bg px-1 text-xs">compute_evidence_record</code>
          ,{" "}
          <code className="rounded bg-brand-bg px-1 text-xs">get_org_rollout_contrast</code>{" "}
          ). Each programme&apos;s rung appears once the gateway field is wired — and, by
          design, only as high as the study honestly supports. Never estimated.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-4 text-sm text-brand-muted">
          No graded programmes yet. A rung needs a verified before→after reading at k≥5
          (E1), a matched non-targeted sibling cohort (E2), or randomised-order rollout
          arms (E3). Empty is the expected state on a single-snapshot book.
        </p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-brand-muted">
                <th className="py-1">Programme</th>
                <th className="py-1 text-right">Effect [95% CI]</th>
                <th className="py-1 text-right">Design</th>
                <th className="py-1 text-right">Rung</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={
                    (r.catalogueKey ?? "") +
                    (r.interventionId ?? "") +
                    (r.targetMetricKey ?? "")
                  }
                  className="border-t border-brand-border/60 align-top"
                >
                  <td className="py-2 text-brand-text">
                    {r.catalogueKey ?? "—"}
                    <div className="text-xs text-brand-muted">
                      {r.productLine ?? "—"} · {r.targetMetricKey ?? "—"}
                    </div>
                  </td>
                  <td className="py-2 text-right tabular-nums">
                    {fmtCi(r)}
                    <div className="text-[11px] text-brand-muted">{r.ciBasis ?? ""}</div>
                  </td>
                  <td className="py-2 text-right text-xs text-brand-muted">
                    {r.design ?? "—"}
                  </td>
                  <td className="py-2 text-right">
                    <Badge color={LEVEL_TONE[r.level]}>
                      {LEVEL_LABEL[r.level].split(" · ")[0]}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-brand-muted">
        Ladder-honest: a programme&apos;s rung is never inflated above the design that
        produced it. Aggregate-only (k≥5 in-DB). Effect &amp; CI are blank, never
        fabricated, where a cohort is suppressed or no comparison/arm exists. E3
        (stepped-wedge) reads treatment-vs-control rollout arms — null on the replica
        until a randomised-order rollout is run.
      </p>
    </Card>
  );
}
