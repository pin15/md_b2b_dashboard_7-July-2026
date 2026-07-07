"use client";

import { useOrgCohortProgress, useOrgCertPassrate } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Badge, Skeleton } from "@/components/ui/primitives";

/**
 * WS-U U2/U3 — Blended-cohort progress + D30 certification pass-rate (k≥5 AGGREGATE).
 * For the L3/HR lens. Reads ONLY get_org_cohort_progress + get_org_cert_passrate via
 * persisted GraphQL — phase distribution + candidate/cert counts and rate. NEVER an
 * individual manager's cohort phase, rubric score, or pass/fail (those are member-
 * private; the employer can't reach them). Sub-k phases/cells render "below threshold".
 */
const PHASE_LABEL: Record<string, string> = {
  async: "Self-study",
  spaced: "Reinforcement",
  live: "Live lab",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

export function CertificationProgressCard({ cohortCode = "D30-2026Q3-A", courseCode = "D30" }: { cohortCode?: string; courseCode?: string }) {
  const { data: cohort, isLoading: lc } = useOrgCohortProgress(cohortCode);
  const { data: cert, isLoading: lp } = useOrgCertPassrate(courseCode);

  if (lc || lp) return <Skeleton className="h-48 w-full rounded-xl" />;

  const cohortComputed = cohort?.status === "computed";
  const certComputed = cert?.status === "computed";

  if (!cohortComputed && !certComputed) {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>Manager certification (D30)</CardTitle>
        <Badge>below reporting threshold</Badge>
        <p className="text-sm text-brand-muted">
          Cohort progress and certification pass-rate light up once at least {cohort?.k ?? cert?.k ?? 5} managers take
          part — group aggregates only, never an individual&apos;s cohort phase or role-play score.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Manager certification (D30)</CardTitle>

      {certComputed && (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-brand-muted">Candidates</span>
            <span className="text-2xl font-semibold tabular-nums">{cert!.candidates}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-brand-muted">Certified</span>
            <span className="text-2xl font-semibold tabular-nums">{cert!.certified}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-brand-muted">Pass-rate</span>
            <span className="text-2xl font-semibold tabular-nums">
              {cert!.passRate == null ? "—" : `${cert!.passRate}%`}
            </span>
            <span className="text-xs text-brand-muted">role-play assessed</span>
          </div>
        </div>
      )}

      {cohortComputed && (
        <div className="mt-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">
            Cohort {cohort!.cohortCode} · {cohort!.totalEnrolments} enrolled
          </span>
          <div className="mt-2 space-y-1.5">
            {cohort!.byPhase.map((p) => (
              <div key={p.phase} className="flex items-center justify-between text-sm">
                <span className="text-brand-text">{PHASE_LABEL[p.phase] ?? p.phase}</span>
                {p.n == null ? (
                  <Badge>below threshold</Badge>
                ) : (
                  <span className="tabular-nums text-brand-muted">{p.n}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Group aggregates at k≥{cohort?.k ?? cert?.k ?? 5}. You never see an individual manager&apos;s cohort phase or
        role-play score.
      </p>
    </Card>
  );
}
