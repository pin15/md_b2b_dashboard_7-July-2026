"use client";

import {
  useOrgCoachingSummary,
  useOrgWorkshopSummary,
  useOrgMhfaCoverage,
} from "@/lib/hooks/useDashboardData";
import { WidgetShell, type UniversalState } from "@/components/dashboard/WidgetState";
import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";

/**
 * WS-R Coaching · Workshops · MHFA — three EMPLOYER AGGREGATE tiles (k≥5). Each
 * reads ONLY its kernel aggregate (get_org_coaching_summary / get_org_workshop_summary
 * / get_org_mhfa_coverage) — counts, attendance/pass rates, a GAS mean, coverage % —
 * NEVER an individual engagement, score, or attendance. Honest-or-pending throughout.
 */
export function CoachingSummaryCard({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgCoachingSummary(period);
  if (isError) return <CardError className="h-40" />;
  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Coaching" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Engagements" value={data.engagements} />
            <Stat label="Completed" value={data.completed} />
            <Stat
              label="Goal attainment"
              value={data.gasMeanAttainment == null ? "—" : data.gasMeanAttainment.toFixed(1)}
              hint="GAS mean −2…+2"
            />
          </div>
          {data.byProduct.length > 0 && (
            <ByList
              rows={data.byProduct.map((p) => ({
                key: p.engagementType,
                label: p.engagementType,
                suppressed: p.status === "suppressed",
                value: p.status === "suppressed" ? null : `${p.completed}/${p.engagements}`,
              }))}
            />
          )}
          <Footnote k={data.k} />
        </>
      )}
    </WidgetShell>
  );
}

export function WorkshopSummaryCard({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgWorkshopSummary(period);
  if (isError) return <CardError className="h-40" />;
  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Workshops" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Registrations" value={data.registrations} />
            <Stat
              label="Attendance"
              value={data.attendanceRate == null ? "—" : `${data.attendanceRate}%`}
              hint={`${data.attended} attended`}
            />
            <Stat
              label="CSAT"
              value={data.meanCsat == null ? "—" : data.meanCsat.toFixed(1)}
              hint="mean 1–5"
            />
          </div>
          {data.byWorkshop.length > 0 && (
            <ByList
              rows={data.byWorkshop.map((w) => ({
                key: w.workshopCode,
                label: w.workshopCode,
                suppressed: w.status === "suppressed",
                value: w.status === "suppressed" ? null : `${w.attended}/${w.registrations}`,
              }))}
            />
          )}
          <Footnote k={data.k} />
        </>
      )}
    </WidgetShell>
  );
}

/**
 * MHFA coverage — a governance KPI. When the org's certified-aider ratio is below
 * target it is a discrete employer KPI (red permitted, doc 10 §2.1); on/above target
 * it is a celebration. No member data anywhere.
 */
export function MhfaCoverageCard() {
  const { data, isLoading, isError } = useOrgMhfaCoverage();
  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (isError) return <CardError className="h-40" />;

  if (!data || data.status !== "computed") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>Mental Health First Aid coverage</CardTitle>
        <Badge>not yet established</Badge>
        <p className="text-sm text-brand-muted">
          A coverage figure appears once an MHFA programme is set up for the organisation. Aggregate counts only.
        </p>
      </Card>
    );
  }

  const onTarget = data.coveragePct != null && data.coveragePct >= 100;
  const state: UniversalState = onTarget ? "celebration" : "alert";

  return (
    <WidgetShell
      title="Mental Health First Aid coverage"
      state={state}
      alertNote={!onTarget ? "Certified aiders below target ratio — consider a new cohort." : undefined}
      celebrationNote={onTarget ? "Aider coverage is at or above target." : undefined}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Certified aiders" value={data.certifiedAiders} />
        <Stat label="Active aiders" value={data.activeAiders} />
        <Stat
          label="Coverage"
          value={data.coveragePct == null ? "—" : `${data.coveragePct}%`}
          hint={data.targetAiders == null ? undefined : `target ${data.targetAiders}`}
        />
      </div>
      <p className="mt-3 text-xs text-brand-muted">
        Programme {data.programStatus ?? "—"} · supervision {data.supervisionCadence ?? "—"}. Aggregate counts only.
      </p>
    </WidgetShell>
  );
}

function Stat({ label, value, hint }: { label: string; value: number | string | null; hint?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-brand-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value ?? "—"}</span>
      {hint && <span className="text-xs text-brand-muted">{hint}</span>}
    </div>
  );
}

function ByList({ rows }: { rows: { key: string; label: string; suppressed: boolean; value: string | null }[] }) {
  return (
    <div className="mt-3 space-y-1.5">
      {rows.map((r) => (
        <div key={r.key} className="flex items-center justify-between text-sm">
          <span className="text-brand-text">{r.label}</span>
          {r.suppressed ? <Badge>below threshold</Badge> : <span className="tabular-nums text-brand-muted">{r.value}</span>}
        </div>
      ))}
    </div>
  );
}

function Footnote({ k }: { k: number | null }) {
  return (
    <p className="mt-3 text-xs text-brand-muted">
      Group aggregates at k≥{k ?? 5}. You never see who took part or any individual&apos;s result.
    </p>
  );
}
