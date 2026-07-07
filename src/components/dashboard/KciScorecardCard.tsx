"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useClinicalQuality } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Stethoscope } from "lucide-react";
import type { ClinicalQuality } from "@/lib/graphql/types";

/**
 * WS-O O4 — KCI clinical scorecard (doc 10 §2.3 / clinical_board forum). The CEO
 * care-OUTCOME view: recovery (reliable improvement), care-track completion, and
 * episode lifecycle, from get_clinical_quality. AGGREGATE-only (k≥5 enforced
 * in-DB on the member-with-follow-up denominator) — no individual, no name.
 *
 * Honest-or-pending + 7 states: 'no_org'/no-data → pending; 'suppressed' → the
 * dignity card (k floor); 'computed' → the numbers. Each rate carries a clinical
 * target (TTFS≥95 / recovery≥50 / completion≥60) — a target MISS is a discrete
 * employer alert, so red is permitted on the value (doc 10 §2.1).
 */

// Care-outcome targets (doc 10 §2.3 KCI table). Higher = better for all three.
const TARGETS = { recovery: 50, completion: 60 } as const;

function rate(v: number | null): string {
  return v == null ? "—" : `${v}%`;
}

export function KciScorecardCard({ period }: { period: string }) {
  const q = useClinicalQuality(period);
  const data = q.data;

  if (q.isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (q.isError) return <CardError className="h-48" />;

  const status = data?.status ?? "no_org";
  const computed = status === "computed";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Stethoscope className="h-4 w-4 text-brand-muted" />
          <CardTitle>Clinical quality (KCI scorecard)</CardTitle>
        </div>
        {computed ? (
          <span className="text-[11px] text-brand-muted">
            n={data?.membersWithFollowup} members in care · k≥{data?.k ?? 5}
          </span>
        ) : (
          <Badge>{status === "suppressed" ? "below threshold" : "pending"}</Badge>
        )}
      </div>

      {!computed ? (
        <p className="text-sm text-brand-muted">
          {status === "suppressed"
            ? `This lights up once at least ${data?.k ?? 5} members have a follow-up measure — care outcomes are aggregate-only, never an individual.`
            : "Care-outcome quality appears once members enter care and a follow-up measure is taken (governed clinical metric — clinical sign-off required to publish)."}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Metric
              label="Recovery rate"
              value={data!.reliableImprovementRate}
              target={TARGETS.recovery}
              hint="reliable improvement"
            />
            <Metric
              label="Care-track completion"
              value={data!.careTrackCompletionRate}
              target={TARGETS.completion}
              hint={`${data!.careTrackCompleted ?? 0}/${data!.careTrackEnrolmentsTotal ?? 0} enrolments`}
            />
            <Metric
              label="Deterioration flag"
              value={data!.deteriorationFlagRate}
              lowerIsBetter
              hint="watch metric"
            />
          </div>
          <div className="grid grid-cols-3 gap-2 rounded-lg bg-brand-bg p-3 text-center">
            <Lifecycle label="Episodes" value={data!.episodesTotal} />
            <Lifecycle label="In care" value={data!.episodesActive} />
            <Lifecycle label="Discharged" value={data!.episodesDischarged} />
          </div>
        </>
      )}

      <p className="text-[11px] text-brand-muted">
        Source: governed clinical metrics (recovery ≥{TARGETS.recovery}% · completion ≥
        {TARGETS.completion}%). Aggregate-only; clinical sign-off gates publication.
      </p>
    </Card>
  );
}

function Metric({
  label,
  value,
  target,
  lowerIsBetter,
  hint,
}: {
  label: string;
  value: number | null;
  target?: number;
  lowerIsBetter?: boolean;
  hint?: string;
}) {
  // Target miss = discrete employer alert → red is permitted (doc 10 §2.1). For
  // the watch-only deterioration metric there is no target, so never red.
  const miss =
    value != null && target != null && !lowerIsBetter && value < target;
  const color = miss ? SEVERITY.red : "var(--brand-text)";
  return (
    <div className="rounded-lg bg-brand-bg p-3">
      <div className="text-xs text-brand-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold tabular-nums" style={{ color }}>
        {rate(value)}
      </div>
      {target != null && (
        <div className="text-[10px] text-brand-muted">target ≥{target}%</div>
      )}
      {hint && <div className="text-[10px] text-brand-muted">{hint}</div>}
    </div>
  );
}

function Lifecycle({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="text-lg font-semibold tabular-nums text-brand-text">
        {value ?? "—"}
      </div>
      <div className="text-[10px] uppercase tracking-wide text-brand-muted">{label}</div>
    </div>
  );
}

export type { ClinicalQuality };
