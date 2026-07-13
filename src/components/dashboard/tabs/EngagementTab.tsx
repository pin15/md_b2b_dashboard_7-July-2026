"use client";

import {
  Panel,
  SectionHeader,
  MicroLabel,
  MicroStat,
  CellTitle,
  Foot,
  BandDot,
  CellSkeleton,
  PanelSkeleton,
} from "@/components/ui/panels";
import { useMetricCells, useOrgFamilyCoverage } from "@/lib/hooks/useDashboardData";
import { SEVERITY, gradientColor } from "@/lib/severity";
import { HintTip } from "@/components/ui/HintTip";
import { Gate } from "@/lib/hooks/useCapabilities";
import { GLOSSARY } from "@/lib/glossary";
import type { ReactNode } from "react";
import type { DashboardFilters, MetricCell } from "@/lib/graphql/types";

/**
 * Engagement tab (doc 10 §4.3) — all aggregate (k≥5). Participation is the metric
 * wired end-to-end today, so this tab is real: completion by department + level,
 * against the 70% contract floor. The therapy-utilisation funnel needs booking
 * data (not in Phase-1 scope) and is honestly deferred — never faked.
 *
 * Visual language (matches the redesigned Act/Overview tabs): typography-led,
 * near-monochrome slate, navy (#1E3A5F) as the single interactive accent.
 * Severity colour appears only on data (numerals, band dots, bar fills) — never
 * as chrome. Boxes are borderless elevation panels; hairline dividers and
 * alignment carry the structure.
 */
const TARGET = 70;

function summarize(cells: MetricCell[]) {
  const shown = cells.filter((c) => !c.suppressed && c.value != null);
  const atTarget = shown.filter((c) => (c.value as number) >= TARGET).length;
  return { atTarget, shown: shown.length, suppressed: cells.length - shown.length };
}

export function EngagementTab({ filters }: { filters: DashboardFilters }) {
  const org = useMetricCells("PARTICIPATION_PCT", "ORG", filters.period);
  const byDept = useMetricCells("PARTICIPATION_PCT", "DEPARTMENT", filters.period);
  const byLevel = useMetricCells("PARTICIPATION_PCT", "LEVEL", filters.period);
  // Published employer engagement metrics (org-grain). Honest-pending/suppressed.
  const uwes = useMetricCells("UWES", "ORG", filters.period);
  const decision = useMetricCells("DECISION_RATE", "ORG", filters.period);
  const optOut = useMetricCells("OPT_OUT_TREND", "ORG", filters.period);

  const orgCell = org.data?.[0];
  const dept = byDept.data ? summarize(byDept.data) : null;
  const loading = org.isLoading || byDept.isLoading || byLevel.isLoading;
  const uwesCell = uwes.data?.[0];
  const decisionCell = decision.data?.[0];
  const optOutCell = optOut.data?.[0];

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Engagement &amp; participation</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Who is taking part — and staying engaged
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          Campaign completion against the 70% contract floor, split by department and level, plus
          the published engagement signals. Everything is a group aggregate at k≥5 — cohorts under
          five stay suppressed by design.
        </p>
      </header>

      {/* ── This campaign — participation headline band ─────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="This campaign" meta={filters.period} />
        <Gate cap="metric:PARTICIPATION_PCT">
          {loading ? (
            <PanelSkeleton />
          ) : (
            <Panel className="grid md:grid-cols-4">
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <ParticipationHero cell={orgCell} />
              </div>
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <CampaignStat
                  label="Depts at / above target"
                  value={dept ? dept.atTarget : null}
                  hint={dept ? `of ${dept.shown} shown` : undefined}
                />
              </div>
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <CampaignStat
                  label="Cohorts below threshold"
                  value={dept ? dept.suppressed : null}
                  hint="n<5 — suppressed"
                />
              </div>
              <div className="p-6">
                <CampaignStat
                  label="Responding employees"
                  value={orgCell && !orgCell.suppressed ? orgCell.n : null}
                  hint="this campaign"
                />
              </div>
            </Panel>
          )}
        </Gate>
      </section>

      {/* ── Completion by cohort ─────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Completion by cohort" meta="completed ÷ assigned · k≥5" />
        <Gate cap="metric:PARTICIPATION_PCT">
          {loading ? (
            <PanelSkeleton />
          ) : (
            <Panel className="grid md:grid-cols-2">
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <CohortCell
                  title="By department"
                  cells={byDept.data ?? []}
                  foot="Completion per department. Cells with fewer than 5 assigned stay suppressed."
                />
              </div>
              <div className="p-6">
                <CohortCell
                  title="By level"
                  cells={byLevel.data ?? []}
                  foot="L1 / L2 / L3 seniority bands. Cells with fewer than 5 assigned stay suppressed."
                />
              </div>
            </Panel>
          )}
        </Gate>
      </section>

      {/* ── Engagement signals (org-grain, k≥5). Honest-pending when a cell
             is null/suppressed — never a fabricated number. ───────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Engagement signals" meta="org-grain · k≥5" />
        {uwes.isLoading || decision.isLoading || optOut.isLoading ? (
          <PanelSkeleton />
        ) : (
          <Panel className="grid md:grid-cols-3">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <SignalCell
                label="Work engagement"
                cell={uwesCell}
                hint={
                  <HintTip tip={GLOSSARY.UWES}>
                    UWES-9 · vigour / dedication / absorption
                  </HintTip>
                }
              />
            </div>
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <SignalCell
                label="Decision rate"
                cell={decisionCell}
                unit="%"
                hint="share of help-seeking that led to action"
              />
            </div>
            <Gate cap="metric:OPT_OUT_TREND">
              <div className="p-6">
                <SignalCell
                  label="Opt-out trend"
                  cell={optOutCell}
                  unit="%"
                  hint="consent opt-outs this period"
                />
              </div>
            </Gate>
          </Panel>
        )}
      </section>

      {/* ── Care & coverage — WS-O O6 step-down brake + family coverage ──── */}
      <section className="space-y-3">
        <SectionHeader title="Care & coverage" />
        <Panel className="grid md:grid-cols-2">
          <Gate cap="metric:HEALTHY_STEP_DOWN_RATE">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <StepDownCell period={filters.period} />
            </div>
          </Gate>
          <div className="p-6">
            <FamilyCoverageCell />
          </div>
        </Panel>
      </section>

      {/* ── Notes colophon (honest scaffolding) ─────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Therapy Utilisation Funnel (Allocated→Booked→Attended→Rebooked) — needs booking data,
            deferred to Phase-2 (doc 12 §8.9).
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── this-campaign cells ─────────────────────────────────────────────────── */

function ParticipationHero({ cell }: { cell?: MetricCell }) {
  const value = cell && !cell.suppressed ? cell.value : null;
  const below = value != null && value < TARGET; // discrete contract-floor alert → red OK
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Overall participation</MicroLabel>
      {value == null ? (
        <>
          <span className="text-[34px] font-semibold leading-10 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">
            below reporting threshold — suppressed for anonymity
          </span>
        </>
      ) : (
        <>
          <span className="text-[34px] font-semibold leading-10 tracking-[-0.02em] tabular-nums text-slate-900">
            {value}
            <span className="ml-0.5 text-[17px] font-medium text-slate-400">%</span>
          </span>
          {below ? (
            <BandDot color={SEVERITY.red} label={`below ${TARGET}% contract floor`} />
          ) : (
            <BandDot color={SEVERITY.green} label="at / above contract floor" />
          )}
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>contract floor {TARGET}%</Foot>
      </div>
    </div>
  );
}

function CampaignStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | null;
  hint?: string;
}) {
  if (value == null) {
    return (
      <div className="flex h-full flex-col gap-1.5">
        <MicroLabel>{label}</MicroLabel>
        <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
        <span className="text-[12px] leading-4 text-slate-500">
          below reporting threshold — suppressed for anonymity
        </span>
      </div>
    );
  }
  return <MicroStat label={label} value={value} hint={hint} />;
}

/* ── completion by cohort ────────────────────────────────────────────────── */

function CohortCell({
  title,
  cells,
  foot,
}: {
  title: string;
  cells: MetricCell[];
  foot: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={
          cells.length > 0
            ? `${cells.filter((c) => !c.suppressed && c.value != null).length} of ${cells.length} shown`
            : undefined
        }
      >
        {title}
      </CellTitle>
      {cells.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          No cohorts yet — cohorts appear once a campaign assigns this cut and it closes.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cells.map((c) => (
            <CohortRow key={`${c.grain}:${c.grainRef ?? "org"}`} cell={c} />
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>{foot}</Foot>
      </div>
    </div>
  );
}

function CohortRow({ cell }: { cell: MetricCell }) {
  const suppressed = cell.suppressed || cell.value == null;
  const label = cell.grainLabel ?? "—";
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-24 shrink-0 truncate text-[12.5px] font-medium text-slate-500"
        title={label}
      >
        {label}
      </span>
      {suppressed ? (
        <span className="flex-1 text-[12.5px] text-slate-400">below threshold</span>
      ) : (
        <>
          <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(cell.value as number, 100)}%`,
                backgroundColor: gradientColor(cell.value as number, true),
              }}
            />
            <div
              className="absolute top-0 h-full w-px bg-slate-300"
              style={{ left: `${TARGET}%` }}
              title={`${TARGET}% target`}
            />
          </div>
          <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-slate-900">
            {cell.value}
          </span>
        </>
      )}
      <span className="w-10 shrink-0 text-right text-[11.5px] tabular-nums text-slate-400">
        n={cell.n}
      </span>
    </div>
  );
}

/* ── engagement signals ──────────────────────────────────────────────────── */

function SignalCell({
  label,
  cell,
  unit,
  hint,
}: {
  label: string;
  cell?: MetricCell;
  unit?: string;
  hint: ReactNode;
}) {
  const suppressed = !!cell?.suppressed;
  const pending = !cell;
  const value = cell && !cell.suppressed ? cell.value : null;
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {value != null ? (
        <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
          {value}
          {unit && <span className="ml-0.5 text-[14px] font-medium text-slate-400">{unit}</span>}
        </span>
      ) : suppressed ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Below reporting threshold — suppressed for anonymity.
        </p>
      ) : (
        <>
          <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">
            {pending ? "pending — publishing" : "pending"}
          </span>
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>{hint}</Foot>
      </div>
    </div>
  );
}

/* ── care & coverage cells ───────────────────────────────────────────────── */

/**
 * WS-O O6 — Healthy Step-Down Rate (doc 10 §3/§5 / engagement_stepdown pair). The
 * BRAKE on engagement/utilisation: of RECOVERED members, the share DE-ESCALATED
 * out of active care (vs retained in dependency). Higher=better. Calm gradient
 * only (kci_band(70, 50): green≥70 / amber≥50 / coral<50 — never red).
 */
function stepDownTone(v: number): string {
  if (v >= 70) return SEVERITY.green;
  if (v >= 50) return SEVERITY.amber;
  return SEVERITY.coral;
}

function StepDownCell({ period }: { period: string }) {
  const org = useMetricCells("HEALTHY_STEP_DOWN_RATE", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load the step-down rate — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Healthy step-down rate</MicroLabel>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 recovered members before a rate is shown."
            : "Pending — appears once recovered members have a step-down outcome (governed care metric)."}
        </p>
      ) : (
        <span className="flex items-baseline gap-2">
          <span
            className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
            style={{ color: stepDownTone(v) }}
          >
            {v}
            <span className="ml-0.5 text-[14px] font-medium">%</span>
          </span>
          <span className="text-[12px] tabular-nums text-slate-500">
            stepped down · n={cell!.n}
          </span>
        </span>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Of members who recovered, the share de-escalated out of active care. The brake on
          utilisation — recovery should lead to independence, not dependency. green ≥70%.
        </Foot>
      </div>
    </div>
  );
}

/**
 * Family / dependent coverage (b2b_280) — share of ACTIVE members with at least
 * one ACTIVE dependent enrolled. AGGREGATE-only, k≥5 enforced IN-DB. Calm
 * gradient only (higher=better: green≥20 / amber≥5 / coral<5 — never red).
 */
function familyTone(p: number): string {
  if (p >= 20) return SEVERITY.green;
  if (p >= 5) return SEVERITY.amber;
  return SEVERITY.coral;
}

function FamilyCoverageCell() {
  const { data, isLoading } = useOrgFamilyCoverage();
  if (isLoading) return <CellSkeleton />;

  const suppressed = !data || data.status === "suppressed";
  const noData = !data || (data.status !== "computed" && data.status !== "suppressed");
  const pct = data?.pctMembersWithActiveDependent ?? null;
  const n = data?.activeMembers ?? null;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Family coverage</MicroLabel>
      {suppressed ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Below the reporting threshold — needs at least 5 active members before a coverage number
          is shown (k≥5).
        </p>
      ) : noData || pct == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — appears once active members and dependent enrolments are in place
          (aggregate-only, governed).
        </p>
      ) : (
        <>
          <span className="flex items-baseline gap-2">
            <span
              className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
              style={{ color: familyTone(pct) }}
            >
              {pct}
              <span className="ml-0.5 text-[14px] font-medium">%</span>
            </span>
            <span className="text-[12px] text-slate-500">
              of members have a dependent enrolled
            </span>
          </span>
          <span className="text-[12px] leading-4 tabular-nums text-slate-500">
            {data!.membersWithActiveDependent ?? 0} of {n} active members
            {n != null ? ` · n=${n}` : ""}
          </span>
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Share of the active workforce with at least one active dependent enrolled. Aggregate
          only — never an enumerable dependent or individual.
        </Foot>
      </div>
    </div>
  );
}
