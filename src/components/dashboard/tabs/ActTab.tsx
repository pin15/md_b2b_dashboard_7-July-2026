"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  MicroStat,
  CellTitle,
  KeyValueRow,
  Foot,
  SuppressedNote,
  CellSkeleton,
  PanelSkeleton,
} from "@/components/ui/panels";
import {
  useOrgInterventionRecommendations,
  useOrgInterventions,
  useBookOrgIntervention,
  useOrgSelfcareEngagement,
  useOrgCoachingSummary,
  useOrgWorkshopSummary,
  useOrgMhfaCoverage,
  useOrgAcademyCompletion,
  useOrgCohortProgress,
  useOrgCertPassrate,
  useOrgObservedClimate,
  useOrgLifeInviteSummary,
  useOrgBridgeSummary,
  useOrgIncidents,
  useOrgIncidentUptake,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY, gradientColor } from "@/lib/severity";
import { Check, ChevronDown } from "lucide-react";
import type {
  DashboardFilters,
  OrgInterventionRecommendation,
  OrgIntervention,
  OrgIncident,
  InterventionStatus,
} from "@/lib/graphql/types";

/**
 * ACT tab (doc 04 §2.3 / the GDAV "Act" beat) — recommend an evidence-graded
 * programme for each off-target metric, book it against a COHORT (never a person),
 * and watch it move through the delivery pipeline. Every surface is aggregate-only.
 *
 * Honest-or-pending throughout:
 *  • Recommendations are empty until a published metric reads off-target at k≥5.
 *  • The pipeline is empty until a committee books something.
 *  • Campaigns are READ-ONLY — no nudge buttons (those would target people).
 *
 * Visual language (sample redesign): typography-led, near-monochrome slate with
 * navy (#1E3A5F) as the single interactive accent. Severity colour appears ONLY
 * on data (gap numerals, status dots) — never as chrome. Boxes stay borderless
 * (elevation only); alignment and hairline dividers carry the structure.
 */

/* ── page-specific primitives (shared ones live in @/components/ui/panels) ── */

function GradeChip({ grade }: { grade: string }) {
  return (
    <span
      title="evidence grade"
      className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-100/80 px-1.5 text-[12px] font-semibold text-slate-500"
    >
      {grade}
    </span>
  );
}

/* ── page ─────────────────────────────────────────────────────────────────── */

export function ActTab({ filters }: { filters: DashboardFilters }) {
  const recs = useOrgInterventionRecommendations(filters.period);
  const board = useOrgInterventions();
  const recRows = recs.data ?? [];
  const boardRows = board.data ?? [];

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Act &amp; programmes</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          What to do — and whether it held
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          For each metric reading off-target this quarter, the evidence library suggests a graded
          programme. Booking commits it for a cohort (k≥5) — never an individual — and it then
          moves through the delivery pipeline below.
        </p>
      </header>

      {/* ── Recommendations — precision ledger ─────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Recommendations"
          meta={recRows.length > 0 ? `${recRows.length} off target · ${filters.period}` : undefined}
        />
        {recs.isLoading ? (
          <PanelSkeleton />
        ) : recRows.length === 0 ? (
          <Panel className="px-6 py-10 text-center">
            <p className="text-[13.5px] font-medium text-slate-900">
              Nothing is off-target this quarter
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
              A recommendation appears only when a published metric reads off its target at k≥5.
              Until then there is no programme to suggest — no fabricated nudge.
            </p>
          </Panel>
        ) : (
          <RecommendationLedger rows={recRows} period={filters.period} />
        )}
      </section>

      {/* ── Delivery pipeline ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Delivery pipeline"
          meta={boardRows.length > 0 ? `${boardRows.length} in flight` : undefined}
        />
        {board.isLoading ? (
          <PanelSkeleton />
        ) : (
          <PipelinePanel rows={boardRows} />
        )}
      </section>

      {/* ── Care & wellbeing ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Care & wellbeing" meta="engagement · k≥5 aggregates" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-r">
            <SelfcareCell period={filters.period} />
          </div>
          <div className="border-b border-slate-100 p-6">
            <CoachingCell period={filters.period} />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <WorkshopsCell period={filters.period} />
          </div>
          <div className="p-6">
            <MhfaCell />
          </div>
        </Panel>
      </section>

      {/* ── People development ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="People development" />
        <Panel className="grid md:grid-cols-3">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <AcademyCell period={filters.period} />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <CertificationCell />
          </div>
          <div className="p-6">
            <ObservedClimateCell />
          </div>
        </Panel>
      </section>

      {/* ── Lifecycle support (KEYSTONE privacy contract) ───────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Lifecycle support" meta="offers only — uptake invisible by construction" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <LifeMomentsCell />
          </div>
          <div className="p-6">
            <BridgesCell />
          </div>
        </Panel>
      </section>

      {/* ── Critical incidents ──────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Critical incidents" />
        <IncidentsSection />
      </section>

      {/* ── Notes colophon (campaigns read-only + honest scaffolding) ───── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Campaigns are read-only.</span>{" "}
            Delivery (reminders, nudges, scheduling) is managed in the HR console — the dashboard
            never targets individuals, so no nudge actions live here.
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            OWI/BRI-targeted programmes stay dormant until those metrics publish (clinical
            sign-off) — they appear in the library but recommend nothing until then.
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Evidence grades are provisional (grade-C, directional) until a content owner ratifies
            the citations.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── Recommendations ledger ──────────────────────────────────────────────── */

const LEDGER_COLS =
  "md:grid md:grid-cols-[minmax(0,1fr)_150px_130px_56px_120px] md:items-center md:gap-4";

function RecommendationLedger({
  rows,
  period,
}: {
  rows: OrgInterventionRecommendation[];
  period: string;
}) {
  const sorted = [...rows].sort((a, b) => (b.shortfall ?? 0) - (a.shortfall ?? 0));
  return (
    <Panel className="overflow-hidden">
      <div
        className={cn(
          "hidden border-b border-slate-100 px-6 py-2.5 md:grid",
          LEDGER_COLS.replace("md:grid ", ""),
        )}
      >
        <MicroLabel>Programme</MicroLabel>
        <MicroLabel>
          <span className="block text-right">Gap</span>
        </MicroLabel>
        <MicroLabel>
          <span className="block text-right">Expected effect</span>
        </MicroLabel>
        <MicroLabel>
          <span className="block text-center">Grade</span>
        </MicroLabel>
        <span />
      </div>
      <div className="divide-y divide-slate-100">
        {sorted.map((r) => (
          <LedgerRow
            key={`${r.catalogueKey}:${r.grain}:${r.grainRef ?? "org"}`}
            rec={r}
            period={period}
          />
        ))}
      </div>
    </Panel>
  );
}

function LedgerRow({ rec: r, period }: { rec: OrgInterventionRecommendation; period: string }) {
  const book = useBookOrgIntervention();
  const tone = r.severity === "coral" ? SEVERITY.coral : SEVERITY.amber;
  const effect =
    r.expectedEffectLow != null && r.expectedEffectHigh != null
      ? `${r.expectedEffectLow > 0 ? "+" : ""}${r.expectedEffectLow}–${r.expectedEffectHigh} pts`
      : "directional";
  const booked = book.isSuccess && !!book.data?.ok;

  const onBook = () =>
    book.mutate({
      catalogueKey: r.catalogueKey,
      grain: r.grain,
      grainRef: r.grain === "ORG" ? null : r.grainRef,
      period,
    });

  return (
    <div className={cn("flex flex-col gap-3 px-6 py-4", LEDGER_COLS)}>
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium leading-5 text-slate-900">{r.name}</p>
        <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
          {r.metricLabel} · {r.cohortLabel}
        </p>
      </div>

      <div className="md:text-right">
        <p className="text-[14px] font-semibold leading-5 tabular-nums" style={{ color: tone }}>
          {r.shortfall != null ? `−${r.shortfall} pts` : "off target"}
        </p>
        <p className="mt-0.5 text-[12px] leading-4 tabular-nums text-slate-500">
          now {r.currentValue ?? "—"} · target {r.targetValue ?? "—"}
        </p>
      </div>

      <div className="md:text-right">
        <p className="text-[13px] font-medium leading-5 tabular-nums text-slate-700">{effect}</p>
        <p className="mt-0.5 text-[12px] leading-4 text-slate-400">per quarter</p>
      </div>

      <div className="md:text-center">
        <GradeChip grade={r.evidenceGrade} />
      </div>

      <div className="md:text-right">
        {r.alreadyActive || booked ? (
          <span className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-slate-400">
            <Check className="h-3.5 w-3.5" style={{ color: SEVERITY.green }} />
            {booked ? "Booked" : "On the board"}
          </span>
        ) : (
          <button
            onClick={onBook}
            disabled={book.isPending}
            className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/[0.05] disabled:text-slate-300 disabled:hover:bg-transparent"
          >
            {book.isPending ? "Booking…" : "Book"}
          </button>
        )}
        {book.data && !book.data.ok && (
          <p className="mt-1 text-[11px] leading-4" style={{ color: SEVERITY.red }}>
            {book.data.error}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Delivery pipeline ───────────────────────────────────────────────────── */

const STAGES: { id: InterventionStatus; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "committee_review", label: "Review" },
  { id: "booked", label: "Booked" },
  { id: "active", label: "Active" },
  { id: "measuring", label: "Measuring" },
  { id: "retired", label: "Retired" },
];

function PipelinePanel({ rows }: { rows: OrgIntervention[] }) {
  if (rows.length === 0) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="text-[13.5px] font-medium text-slate-900">No programmes on the board yet</p>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
          Book a recommendation above and it lands here, then moves through committee review,
          active, measuring, and retired as the work progresses.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      {/* stage rail */}
      <div className="grid grid-cols-3 border-b border-slate-100 md:grid-cols-6">
        {STAGES.map((stage, i) => {
          const count = rows.filter((r) => r.status === stage.id).length;
          return (
            <div
              key={stage.id}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-3.5",
                i > 0 && "border-l border-slate-100",
              )}
            >
              <span
                className={cn(
                  "text-[17px] font-semibold leading-6 tabular-nums",
                  count > 0 ? "text-slate-900" : "text-slate-300",
                )}
              >
                {count}
              </span>
              <MicroLabel>{stage.label}</MicroLabel>
            </div>
          );
        })}
      </div>

      {/* in-flight programmes */}
      <div className="divide-y divide-slate-100">
        {rows.map((r) => {
          const stageIdx = STAGES.findIndex((s) => s.id === r.status);
          return (
            <div
              key={r.id}
              className="flex flex-col gap-3 px-6 py-4 md:grid md:grid-cols-[minmax(0,1fr)_180px_56px] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                <p className="truncate text-[14px] font-medium leading-5 text-slate-900">
                  {r.name}
                </p>
                <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
                  {r.metricLabel} · {r.cohortLabel}
                </p>
              </div>
              <div className="flex items-center gap-2.5 md:justify-end">
                <span className="flex items-center gap-1" aria-hidden>
                  {STAGES.map((s, i) => (
                    <span
                      key={s.id}
                      className={cn(
                        "h-[5px] w-[5px] rounded-full",
                        i <= stageIdx ? "bg-[#1E3A5F]" : "bg-slate-200",
                      )}
                    />
                  ))}
                </span>
                <span className="text-[12px] font-medium text-slate-500">
                  {STAGES[stageIdx]?.label ?? r.status}
                </span>
              </div>
              <div className="md:text-center">
                <GradeChip grade={r.evidenceGrade} />
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/* ── Care & wellbeing cells ──────────────────────────────────────────────── */

const SURFACE_LABEL: Record<string, string> = {
  programmes: "Self-guided programmes",
  mindfulness: "Mindfulness library",
  journal: "Mood journal",
  habits: "Habits",
  nudges: "Nudges",
  resources: "Resource hub",
};

function SelfcareCell({ period }: { period: string }) {
  const { data, isLoading } = useOrgSelfcareEngagement(period ?? null);
  if (isLoading) return <CellSkeleton />;
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Self-care engagement
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4">
            <MicroStat label="Active people (30d)" value={data.activeEngagers} />
            <MicroStat label="Covered lives" value={data.coveredLives} />
          </div>
          {data.bySurface.length > 0 && (
            <div>
              <MicroLabel>By surface</MicroLabel>
              <div className="mt-1.5">
                {data.bySurface.map((s) => (
                  <KeyValueRow
                    key={s.surface}
                    label={SURFACE_LABEL[s.surface] ?? s.surface}
                    value={`${s.members} people · ${s.events} times`}
                  />
                ))}
              </div>
            </div>
          )}
          <div className="mt-auto pt-1">
            <Foot>
              Engagement only — never an individual, and never confused with an outcome (measured
              separately). Group aggregates at k≥{data.k ?? 5}.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

function CoachingCell({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgCoachingSummary(period);
  if (isLoading) return <CellSkeleton />;
  if (isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load coaching — refresh to retry.
      </p>
    );
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Coaching
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MicroStat label="Engagements" value={data.engagements} />
            <MicroStat label="Completed" value={data.completed} />
            <MicroStat
              label="Goal attainment"
              value={data.gasMeanAttainment == null ? "—" : data.gasMeanAttainment.toFixed(1)}
              hint="GAS mean −2…+2"
            />
          </div>
          {data.byProduct.length > 0 && (
            <div>
              {data.byProduct.map((p) => (
                <KeyValueRow
                  key={p.engagementType}
                  label={p.engagementType}
                  suppressed={p.status === "suppressed"}
                  value={`${p.completed}/${p.engagements}`}
                />
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            <Foot>
              Group aggregates at k≥{data.k ?? 5}. You never see who took part or any
              individual&apos;s result.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

function WorkshopsCell({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgWorkshopSummary(period);
  if (isLoading) return <CellSkeleton />;
  if (isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load workshops — refresh to retry.
      </p>
    );
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Workshops
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <MicroStat label="Registrations" value={data.registrations} />
            <MicroStat
              label="Attendance"
              value={data.attendanceRate == null ? "—" : `${data.attendanceRate}%`}
              hint={`${data.attended} attended`}
            />
            <MicroStat
              label="CSAT"
              value={data.meanCsat == null ? "—" : data.meanCsat.toFixed(1)}
              hint="mean 1–5"
            />
          </div>
          {data.byWorkshop.length > 0 && (
            <div>
              {data.byWorkshop.map((w) => (
                <KeyValueRow
                  key={w.workshopCode}
                  label={w.workshopCode}
                  suppressed={w.status === "suppressed"}
                  value={`${w.attended}/${w.registrations}`}
                />
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            <Foot>
              Group aggregates at k≥{data.k ?? 5}. You never see who took part or any
              individual&apos;s result.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

function MhfaCell() {
  const { data, isLoading, isError } = useOrgMhfaCoverage();
  if (isLoading) return <CellSkeleton />;
  if (isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load MHFA coverage — refresh to retry.
      </p>
    );

  if (!data || data.status !== "computed") {
    return (
      <div className="flex h-full flex-col gap-3">
        <CellTitle state="not yet established">Mental Health First Aid</CellTitle>
        <SuppressedNote>
          A coverage figure appears once an MHFA programme is set up for the organisation.
          Aggregate counts only.
        </SuppressedNote>
      </div>
    );
  }

  const onTarget = data.coveragePct != null && data.coveragePct >= 100;
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={
          <span
            className="inline-flex items-center gap-1.5 text-[11.5px] font-medium"
            style={{ color: onTarget ? SEVERITY.green : SEVERITY.red }}
          >
            <span
              aria-hidden
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: onTarget ? SEVERITY.green : SEVERITY.red }}
            />
            {onTarget ? "at target" : "below target"}
          </span>
        }
      >
        Mental Health First Aid
      </CellTitle>
      <div className="grid grid-cols-3 gap-4">
        <MicroStat label="Certified aiders" value={data.certifiedAiders} />
        <MicroStat label="Active aiders" value={data.activeAiders} />
        <MicroStat
          label="Coverage"
          value={data.coveragePct == null ? "—" : `${data.coveragePct}%`}
          hint={data.targetAiders == null ? undefined : `target ${data.targetAiders}`}
        />
      </div>
      {!onTarget && (
        <p className="text-[12px] font-medium leading-4" style={{ color: SEVERITY.red }}>
          Certified aiders below target ratio — consider a new cohort.
        </p>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Programme {data.programStatus ?? "—"} · supervision {data.supervisionCadence ?? "—"}.
          Aggregate counts only.
        </Foot>
      </div>
    </div>
  );
}

/* ── People development cells ────────────────────────────────────────────── */

function AcademyCell({ period }: { period: string }) {
  const { data, isLoading } = useOrgAcademyCompletion(period);
  if (isLoading) return <CellSkeleton />;
  if (!data) return null;

  if (data.status !== "computed") {
    return (
      <div className="flex h-full flex-col gap-3">
        <CellTitle state={`below threshold · k≥${data.k ?? 5}`}>Manager Academy</CellTitle>
        <SuppressedNote>
          Academy completion lights up once at least {data.k ?? 5} people in the organisation have
          enrolled — group aggregates only, never an individual&apos;s progress.
        </SuppressedNote>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Manager Academy</CellTitle>
      <div className="grid grid-cols-3 gap-4">
        <MicroStat label="Enrolled" value={data.enrolments} />
        <MicroStat
          label="Completion"
          value={data.completionRate == null ? "—" : `${data.completionRate}%`}
          hint={`${data.completed} completed`}
        />
        <MicroStat
          label="Applying it (L3)"
          value={
            data.l3AdoptionStatus === "computed" && data.l3AdoptionRate != null
              ? `${data.l3AdoptionRate}%`
              : "—"
          }
          hint="used the skill at 30 days"
        />
      </div>
      {data.byDepartment.length > 0 && (
        <div>
          <MicroLabel>By department</MicroLabel>
          <div className="mt-1.5">
            {data.byDepartment.map((d, i) => (
              <KeyValueRow
                key={d.departmentId ?? `dept-${i}`}
                label={d.departmentId ?? "Unassigned"}
                suppressed={d.status === "suppressed"}
                value={`${d.completed}/${d.enrolments} · ${d.completionRate}%`}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Group aggregates at k≥{data.k ?? 5}. You never see who enrolled or any individual&apos;s
          progress or score.
        </Foot>
      </div>
    </div>
  );
}

const PHASE_LABEL: Record<string, string> = {
  async: "Self-study",
  spaced: "Reinforcement",
  live: "Live lab",
  completed: "Completed",
  withdrawn: "Withdrawn",
};

function CertificationCell({
  cohortCode = "D30-2026Q3-A",
  courseCode = "D30",
}: {
  cohortCode?: string;
  courseCode?: string;
}) {
  const { data: cohort, isLoading: lc } = useOrgCohortProgress(cohortCode);
  const { data: cert, isLoading: lp } = useOrgCertPassrate(courseCode);
  if (lc || lp) return <CellSkeleton />;

  const cohortComputed = cohort?.status === "computed";
  const certComputed = cert?.status === "computed";

  if (!cohortComputed && !certComputed) {
    return (
      <div className="flex h-full flex-col gap-3">
        <CellTitle state={`below threshold · k≥${cohort?.k ?? cert?.k ?? 5}`}>
          Manager certification (D30)
        </CellTitle>
        <SuppressedNote>
          Cohort progress and pass-rate light up once at least {cohort?.k ?? cert?.k ?? 5} managers
          take part — group aggregates only, never an individual&apos;s cohort phase or role-play
          score.
        </SuppressedNote>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Manager certification (D30)</CellTitle>
      {certComputed && (
        <div className="grid grid-cols-3 gap-4">
          <MicroStat label="Candidates" value={cert!.candidates} />
          <MicroStat label="Certified" value={cert!.certified} />
          <MicroStat
            label="Pass-rate"
            value={cert!.passRate == null ? "—" : `${cert!.passRate}%`}
            hint="role-play assessed"
          />
        </div>
      )}
      {cohortComputed && (
        <div>
          <MicroLabel>
            Cohort {cohort!.cohortCode} · {cohort!.totalEnrolments} enrolled
          </MicroLabel>
          <div className="mt-1.5">
            {cohort!.byPhase.map((p) => (
              <KeyValueRow
                key={p.phase}
                label={PHASE_LABEL[p.phase] ?? p.phase}
                suppressed={p.n == null}
                value={p.n}
              />
            ))}
          </div>
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Group aggregates at k≥{cohort?.k ?? cert?.k ?? 5}. You never see an individual
          manager&apos;s cohort phase or role-play score.
        </Foot>
      </div>
    </div>
  );
}

const CONSTRUCT_LABEL: Record<string, string> = {
  voice_equity: "Voice equity",
  blame: "Blame-free response",
  conflict_maturity: "Conflict maturity",
  decision_health: "Decision health",
};

function ObservedClimateCell() {
  const { data, isLoading } = useOrgObservedClimate();
  if (isLoading) return <CellSkeleton />;
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Observed climate (FieldLens)
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <p className="text-[12px] leading-relaxed text-slate-500">
            {data.reliableSessions} reliable observation sessions (inter-rater κ≥0.70). Means on a
            0–4 behavioural scale.
          </p>
          <div>
            {data.observed.map((c) => (
              <div
                key={c.constructCode}
                className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5"
              >
                <span className="min-w-0 truncate text-slate-600">
                  {CONSTRUCT_LABEL[c.constructCode] ?? c.constructCode}
                </span>
                {c.status === "suppressed" || c.observedMean == null ? (
                  <span className="shrink-0 text-slate-400">below threshold</span>
                ) : (
                  <span
                    className="shrink-0 font-semibold tabular-nums"
                    style={{ color: gradientColor((c.observedMean / 4) * 100, true) }}
                  >
                    {c.observedMean.toFixed(1)} / 4
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="mt-auto pt-1">
            <Foot>
              Observed, not self-reported. Per-construct aggregates at k≥{data.k ?? 5} reliable
              sessions — never an individual or a named team.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Lifecycle support cells ─────────────────────────────────────────────── */

const MOMENT_LABEL: Record<string, string> = {
  new_parent: "New parent",
  bereavement: "Bereavement",
  caregiving: "Caregiving",
  divorce: "Separation",
  health: "Health event",
  relocation: "Relocation",
  retirement: "Retirement",
  menopause: "Menopause",
};

function LifeMomentsCell() {
  const { data, isLoading } = useOrgLifeInviteSummary();
  if (isLoading) return <CellSkeleton />;
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Life-moment support
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <MicroStat label="Invitations sent" value={data.invitationsSent} />
          {data.byMomentType.length > 0 && (
            <div>
              {data.byMomentType.map((m) => (
                <KeyValueRow
                  key={m.momentType}
                  label={MOMENT_LABEL[m.momentType] ?? m.momentType}
                  value={m.sent}
                />
              ))}
            </div>
          )}
          <div className="mt-auto pt-1">
            <Foot>
              Sent count only. Whether anyone accepted, declined, or used support is never
              disclosed — invisible by construction.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

function BridgesCell() {
  const { data, isLoading } = useOrgBridgeSummary();
  if (isLoading) return <CellSkeleton />;
  const live = data?.status === "computed";
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={!live ? `below threshold · k≥${data?.k ?? 5}` : undefined}>
        Continuity bridges — leavers
      </CellTitle>
      {!live ? (
        <SuppressedNote k={data?.k} />
      ) : (
        <>
          <MicroStat label="Bridges offered" value={data.bridgesOffered} />
          <div className="mt-auto pt-1">
            <Foot>
              Care follows the person out — a 90-day bridge is offered to leavers. Offer count
              only; acceptance and use are never disclosed.
            </Foot>
          </div>
        </>
      )}
    </div>
  );
}

/* ── Critical incidents ──────────────────────────────────────────────────── */

const STATUS_TONE: Record<string, string> = {
  readiness: SEVERITY.amber,
  active: SEVERITY.red,
  response: SEVERITY.red,
  recovery: SEVERITY.amber,
  closed: SEVERITY.green,
};

const TYPE_LABEL: Record<string, string> = {
  layoff: "Workforce reduction",
  m_and_a: "M&A integration",
  postvention: "Postvention",
  dv: "Domestic violence",
  violence_threat: "Violence / threat",
  critical_incident: "Critical incident",
  bcp: "Business continuity",
};

function IncidentsSection() {
  const { data, isLoading } = useOrgIncidents();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <PanelSkeleton />;
  const incidents = data?.incidents ?? [];

  if (incidents.length === 0) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="text-[13.5px] font-medium text-slate-900">No critical incidents on record</p>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
          Readiness retainers activate an SLA clock the moment one is declared.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="divide-y divide-slate-100">
        {incidents.map((inc) => (
          <IncidentRow
            key={inc.id}
            inc={inc}
            open={selected === inc.id}
            onToggle={() => setSelected(selected === inc.id ? null : inc.id)}
          />
        ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          Incident register + uptake only. Who was offered support and who accepted is never
          disclosed; the accepted count is suppressed below the privacy floor.
        </Foot>
      </div>
    </Panel>
  );
}

function IncidentRow({
  inc,
  open,
  onToggle,
}: {
  inc: OrgIncident;
  open: boolean;
  onToggle: () => void;
}) {
  const tone = STATUS_TONE[inc.status] ?? SEVERITY.amber;
  return (
    <div className="px-6 py-4">
      <button onClick={onToggle} className="flex w-full items-center justify-between gap-4 text-left">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-medium leading-5 text-slate-900">
            {inc.title ?? TYPE_LABEL[inc.incidentType] ?? inc.incidentType}
          </p>
          <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
            {TYPE_LABEL[inc.incidentType] ?? inc.incidentType}
            {inc.severityTier ? ` · ${inc.severityTier}` : ""} · {inc.scope ?? "—"}
            {inc.affectedEstimate != null ? ` · ~${inc.affectedEstimate} affected` : ""}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color: tone }}>
            <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
            {inc.status}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-slate-300 transition-transform", open && "rotate-180")}
          />
        </span>
      </button>
      {open && (
        <div className="mt-3.5 border-t border-slate-100 pt-3.5">
          {inc.summary && (
            <p className="text-[12.5px] leading-relaxed text-slate-500">{inc.summary}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] tabular-nums text-slate-400">
            {inc.activatedAt && <span>Activated {fmt(inc.activatedAt)}</span>}
            {inc.activationDueAt && <span>SLA due {fmt(inc.activationDueAt)}</span>}
            {inc.irpIssuedAt && <span>IRP {fmt(inc.irpIssuedAt)}</span>}
            {inc.recoveryAt && <span>Recovery {fmt(inc.recoveryAt)}</span>}
            {inc.closedAt && <span>Closed {fmt(inc.closedAt)}</span>}
          </div>
          <IncidentUptake incidentId={inc.id} />
        </div>
      )}
    </div>
  );
}

function IncidentUptake({ incidentId }: { incidentId: string }) {
  const { data, isLoading } = useOrgIncidentUptake(incidentId);
  if (isLoading) return <div className="mt-3 h-12 skeleton rounded-lg" />;
  if (!data || data.status !== "computed") {
    return (
      <p className="mt-3 text-[11.5px] text-slate-400">
        Support uptake is below the reporting threshold (k≥{data?.k ?? 5}) — unshowable by design.
      </p>
    );
  }
  return (
    <div className="mt-4 flex gap-8">
      <MicroStat label="Offers sent" value={data.offersSent} />
      <MicroStat
        label="Accepted"
        value={data.acceptedSuppressed ? "below threshold" : data.accepted}
      />
    </div>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
