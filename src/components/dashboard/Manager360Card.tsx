"use client";

import { useManager360 } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Badge, Skeleton } from "@/components/ui/primitives";

const INTERP_LABEL: Record<string, string> = {
  blind_spot_self_higher: "Blind spot — you rate yourself higher than your team does",
  self_critical_team_higher: "Modesty — your team rates you higher than you rate yourself",
  aligned: "Aligned — your self-view matches your team's",
  no_self_rating: "No self-rating on file",
};

/**
 * "My 360" (own report only). Self-vs-rater gap per domain, with a ≥4-rater
 * anonymity floor — below it the card shows the honest self/coach-debrief state.
 * Individual raters are never shown; the subject is derived in-DB from auth.uid().
 */
export function Manager360Card() {
  const { data, isLoading } = useManager360();

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  if (!data || data.status === "no_review") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>My 360</CardTitle>
        <p className="text-sm text-brand-muted">
          {data?.reason ??
            "No 360 review on file yet. Your 360 runs in self + coach-debrief mode until at least 4 raters complete it."}
        </p>
      </Card>
    );
  }

  if (data.suppressed) {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>My 360</CardTitle>
        <Badge>self + coach-debrief mode</Badge>
        <p className="text-sm text-brand-muted">{data.reason}</p>
      </Card>
    );
  }

  const gap = data.overallGap;
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <CardTitle>My 360</CardTitle>
        <Badge>{data.completedRaters} raters</Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-semibold tabular-nums text-brand-text">
          {gap != null ? `${gap >= 0 ? "+" : ""}${gap}` : "—"}
        </span>
        <span className="text-xs text-brand-muted">self − team overall gap (1–5 scale)</span>
      </div>
      <p className="text-sm text-brand-text">
        {INTERP_LABEL[data.interpretation ?? ""] ?? data.interpretation}
      </p>
      <div className="flex flex-col gap-1.5">
        {data.domains.map((d) => (
          <div key={d.domain} className="flex items-center justify-between text-xs">
            <span className="capitalize text-brand-muted">{d.domain.replace(/_/g, " ")}</span>
            <span className="tabular-nums text-brand-text">
              self {d.selfMean} · team {d.raterMean}{" "}
              <span className="text-brand-muted">
                (gap {d.gap != null && d.gap >= 0 ? "+" : ""}
                {d.gap})
              </span>
            </span>
          </div>
        ))}
      </div>
      <div className="text-xs text-brand-muted">
        ≥4-rater floor · individual raters never shown · your report only
      </div>
    </Card>
  );
}
