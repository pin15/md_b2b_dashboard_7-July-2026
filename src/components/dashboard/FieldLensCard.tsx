"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardTitle, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { getOrgFieldLens, type FieldLensSignal } from "@/lib/graphql/fieldlens";
import { Radar } from "lucide-react";

/**
 * FieldLens — Online-channel trust deltas (WS-U §5, b2b_300). An L3/CHRO trust lens
 * (never a manager leaderboard). Three cohort signals, each k≥5 and aggregate-only:
 *
 *   • Anonymity Delta  — identified battery rosier than the anonymous pulse → people
 *                        answer the named survey more carefully → candour deficit.
 *   • Conformity Delta — a department whose completion is uniform/fast/low-variance
 *                        RELATIVE TO ITS PEERS → manufactured-consensus fingerprint.
 *   • Should-Would Gap — stated intent (retention + engagement) exceeds the revealed
 *                        pulse trajectory → "says it, doesn't live it."
 *
 * Coercion-fingerprint-adjacent: these moderate trust confidence and prompt a ROLLOUT
 * conversation, never individual blame. Ships dim/pending until the three metric
 * definitions are flipped is_active (clinical/trust sign-off); the resolver returns
 * an empty set in the meantime, so the card explains the gate honestly.
 */

const LABEL: Record<FieldLensSignal["signal"], string> = {
  anonymity_delta: "Anonymity Delta",
  conformity_delta: "Conformity Delta",
  should_would_gap: "Should-Would Gap",
};

// All three: higher discount = worse (more trust erosion). Calm gradient, never red.
function tone(discount: number): string {
  if (discount <= 10) return SEVERITY.green;
  if (discount <= 40) return SEVERITY.amber;
  return SEVERITY.coral;
}

function unit(signal: FieldLensSignal["signal"]): string {
  return signal === "conformity_delta" ? "signals" : "pts gap";
}

export function FieldLensCard({ period }: { period: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["orgFieldLens", period],
    queryFn: () => getOrgFieldLens(period),
  });

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const signals = data?.signals ?? [];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Radar className="h-4 w-4 text-brand-muted" />
        <CardTitle>FieldLens · Online-channel trust deltas</CardTitle>
      </div>

      {signals.length === 0 ? (
        <p className="text-sm text-brand-muted">
          Pending — appears once the identified battery and anonymous pulse both run
          for the same departments (k≥5) and the trust deltas are switched on after
          sign-off. Cohort-only; never names or flags a person.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {signals.map((s, i) => (
            <li
              key={`${s.signal}-${s.departmentId ?? "org"}-${i}`}
              className="flex items-baseline justify-between gap-2"
            >
              <span className="text-sm text-brand-muted">
                {LABEL[s.signal]}
                {s.mode === "shadow" ? " · shadow" : ""}
              </span>
              <span className="flex items-baseline gap-1">
                <span
                  className="text-2xl font-semibold tabular-nums"
                  style={{ color: tone(s.discount) }}
                >
                  {s.value == null ? "—" : s.value > 0 ? `+${s.value}` : s.value}
                </span>
                <span className="text-xs text-brand-muted">
                  {unit(s.signal)} · n={s.n}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="text-[11px] text-brand-muted">
        Coercion-adjacent trust signals. Aggregate only, k≥5; a rollout/remediation
        prompt, never individual blame. L3/CHRO lens.
      </p>
    </Card>
  );
}
