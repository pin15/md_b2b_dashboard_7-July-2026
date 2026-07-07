"use client";

import { Card, CardTitle, Skeleton } from "@/components/ui/primitives";
import { useOrgFamilyCoverage } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { Users } from "lucide-react";

/**
 * Family / dependent coverage (b2b_280) — workforce coverage for the Engagement
 * tab. Shows the share of ACTIVE members who have at least one ACTIVE dependent
 * enrolled, e.g. "1.9% of members have a dependent enrolled" (n = active members).
 *
 * AGGREGATE-only: counts of members + a percentage, never an enumerable dependent
 * or individual. k≥5 enforced IN-DB — `suppressed` ⇒ the whole cell is withheld.
 * Calm gradient only (coverage is a continuous "more is better" value, never red).
 */

// pct of members with a dependent enrolled: higher=better (calm gradient).
function tone(p: number): string {
  if (p >= 20) return SEVERITY.green;
  if (p >= 5) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function FamilyCoverageCard() {
  const { data, isLoading } = useOrgFamilyCoverage();

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const suppressed = !data || data.status === "suppressed";
  const noData =
    !data || (data.status !== "computed" && data.status !== "suppressed");
  const pct = data?.pctMembersWithActiveDependent ?? null;
  const n = data?.activeMembers ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-brand-muted" />
        <CardTitle>Family coverage</CardTitle>
      </div>

      {suppressed ? (
        <p className="text-sm text-brand-muted">
          Below the reporting threshold — needs at least 5 active members before a
          coverage number is shown (k≥5).
        </p>
      ) : noData || pct == null ? (
        <p className="text-sm text-brand-muted">
          Pending — appears once active members and dependent enrolments are in
          place (aggregate-only, governed).
        </p>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span
              className="text-4xl font-semibold tabular-nums"
              style={{ color: tone(pct) }}
            >
              {pct}%
            </span>
            <span className="text-sm text-brand-muted">
              of members have a dependent enrolled
            </span>
          </div>
          <div className="text-[11px] text-brand-muted">
            {data!.membersWithActiveDependent ?? 0} of {n} active members
            {n != null ? ` · n=${n}` : ""}
          </div>
        </>
      )}

      <p className="text-[11px] text-brand-muted">
        Share of the active workforce with at least one active dependent enrolled.
        Aggregate only — never an enumerable dependent or individual.
      </p>
    </Card>
  );
}
