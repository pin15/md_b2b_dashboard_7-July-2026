"use client";

import { useOrgAcademyCompletion } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Badge, Skeleton } from "@/components/ui/primitives";

/**
 * WS-U U0 — Manager Academy completion (k≥5 AGGREGATE). For the L3/HR lens.
 * Reads ONLY get_org_academy_completion via the persisted GraphQL query — counts
 * and rates per org/dept, plus L3 behaviour-adoption. NEVER an individual learner's
 * progress or score (those are member-private; the employer can't reach them).
 * Sub-k departments render "below threshold", never a number.
 */
export function AcademyCompletionCard({ period }: { period: string }) {
  const { data, isLoading } = useOrgAcademyCompletion(period);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (!data) return null;

  if (data.status !== "computed") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>Manager Academy</CardTitle>
        <Badge>below reporting threshold</Badge>
        <p className="text-sm text-brand-muted">
          Academy completion lights up once at least {data.k ?? 5} people in the organisation have enrolled — group
          aggregates only, never an individual&apos;s progress.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Manager Academy</CardTitle>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Enrolled</span>
          <span className="text-2xl font-semibold tabular-nums">{data.enrolments}</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Completion</span>
          <span className="text-2xl font-semibold tabular-nums">
            {data.completionRate == null ? "—" : `${data.completionRate}%`}
          </span>
          <span className="text-xs text-brand-muted">{data.completed} completed</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Applying it (L3)</span>
          <span className="text-2xl font-semibold tabular-nums">
            {data.l3AdoptionStatus === "computed" && data.l3AdoptionRate != null ? `${data.l3AdoptionRate}%` : "—"}
          </span>
          <span className="text-xs text-brand-muted">used the skill at 30 days</span>
        </div>
      </div>

      {data.byDepartment.length > 0 && (
        <div className="mt-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">By department</span>
          <div className="mt-2 space-y-1.5">
            {data.byDepartment.map((d, i) => (
              <div key={d.departmentId ?? `dept-${i}`} className="flex items-center justify-between text-sm">
                <span className="text-brand-text">{d.departmentId ?? "Unassigned"}</span>
                {d.status === "suppressed" ? (
                  <Badge>below threshold</Badge>
                ) : (
                  <span className="tabular-nums text-brand-muted">
                    {d.completed}/{d.enrolments} · {d.completionRate}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Group aggregates at k≥{data.k ?? 5}. You never see who enrolled or any individual&apos;s progress or score.
      </p>
    </Card>
  );
}
