"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useEngagedCoveredLives } from "@/lib/northstar";
import { Users } from "lucide-react";

/**
 * North-Star — ENGAGED COVERED LIVES (WS-C C). The single headline that answers
 * "are people actually using this?": covered lives with ≥1 meaningful interaction
 * this quarter, from get_org_engaged_covered_lives. COUNT-only and AGGREGATE-only
 * (k≥5 enforced in-DB on the engaged numerator) — no individual, no name.
 *
 * Honest-or-pending: 'suppressed' → the dignity tile (k floor); otherwise the count
 * + engaged-rate. This is a calm headline, never a discrete alert — no red.
 */
export function EngagedCoveredLivesCard({ period }: { period: string }) {
  const q = useEngagedCoveredLives(period);
  const data = q.data;

  if (q.isLoading) return <Skeleton className="h-44 w-full rounded-xl" />;
  if (q.isError) return <CardError className="h-44" />;

  const suppressed = data?.suppressed ?? true;
  const ratePct =
    data?.engagedRate != null ? Math.round(data.engagedRate * 1000) / 10 : null;

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-muted" />
          <CardTitle>Engaged covered lives</CardTitle>
        </div>
        <Badge>North-Star</Badge>
      </div>

      {suppressed || !data ? (
        <p className="text-sm text-brand-muted">
          This lights up once at least {data?.k ?? 5} covered lives have engaged —
          North-Star is a count, aggregate-only, and never an individual.
        </p>
      ) : (
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-semibold tabular-nums text-brand-text">
              {data.engagedLives}
            </span>
            <span className="text-sm text-brand-muted">
              / {data.coveredLives} covered lives
            </span>
          </div>
          {ratePct != null && (
            <span className="text-xs text-brand-muted">
              {ratePct}% engaged this quarter · ≥1 meaningful interaction
            </span>
          )}
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Source: governed North-Star metric · count-only · k≥{data?.k ?? 5} · aggregate.
      </p>
    </Card>
  );
}
