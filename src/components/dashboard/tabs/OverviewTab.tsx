"use client";

import {
  Panel,
  SectionHeader,
  MicroLabel,
  Foot,
  BandDot,
  PanelSkeleton,
} from "@/components/ui/panels";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  useOverview,
  useOrgCareEngagement,
  useExecTeamPsafety,
  useDataConfidence,
  useMetricTrend,
  useOrgInsights,
  useOrgQuadrant,
} from "@/lib/hooks/useDashboardData";
import { useEngagedCoveredLives } from "@/lib/northstar";
import { SEVERITY, owiBand, stressBucketColor } from "@/lib/severity";
import { FreshnessStamp } from "@/components/dashboard/FreshnessStamp";
import { ProjectRoadmap } from "@/components/dashboard/ProjectRoadmap";
import type {
  DashboardFilters,
  ExecTeamPsafety,
  SegmentationSlice,
  ByLevelOwi,
  CoverageTile,
  TeamExtreme,
  MetricKey,
  TrendPoint,
  QuadrantPoint,
  InsightCard as InsightCardT,
} from "@/lib/graphql/types";

/**
 * Overview tab — the Phase-1 acceptance surface. Renders entirely from the
 * GraphQL `overview` query (mock-first). Suppressed cells show "below reporting
 * threshold"; pending KPIs stay honestly pending — never a fabricated number.
 *
 * Visual language (matches the redesigned Act tab): typography-led, near-
 * monochrome slate, navy (#1E3A5F) as the single interactive accent. Severity
 * colour appears only on data (band dots, bar fills, series strokes) — never as
 * chrome. Boxes are borderless elevation panels; hairline dividers and column
 * alignment carry the structure. The ProjectRoadmap component is untouched.
 */

/* ── page ─────────────────────────────────────────────────────────────────── */

export function OverviewTab({ filters }: { filters: DashboardFilters }) {
  const { data, isLoading, isError, error } = useOverview(filters);
  const care = useOrgCareEngagement(filters.period);
  const psafety = useExecTeamPsafety(filters.period);
  const confidence = useDataConfidence(filters.period);
  // first-quarter detection: a published OWI trend with < 2 points → no QoQ yet.
  const owiTrend = useMetricTrend("OWI");

  if (isLoading) {
    return (
      <div className="space-y-8">
        <ProjectRoadmap />
        <PanelSkeleton className="h-64" />
        <PanelSkeleton className="h-40" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-8">
        <ProjectRoadmap />
        <Panel className="px-6 py-8 text-center">
          <p className="text-[13.5px] font-medium" style={{ color: SEVERITY.red }}>
            Could not load the overview. {error instanceof Error ? error.message : ""}
          </p>
        </Panel>
      </div>
    );
  }

  const { kpis } = data;
  const highStressBreached = (kpis.highStressPct ?? 0) > 20; // discrete alert → red OK

  // ── universal zone states (WS-L residual) — every signal from REAL data.
  const trendPoints = (owiTrend.data ?? []).filter((p) => !p.suppressed && p.value != null);
  const isFirstQuarter = !owiTrend.isLoading && trendPoints.length < 2;
  const isStale = data.freshness.status === "stale";
  const isLowConfidence = confidence.data?.lowConfidence === true;
  const teamCells = [
    ...(data.teamExtremes.mostVulnerable ? [data.teamExtremes.mostVulnerable] : []),
    ...(data.teamExtremes.happiest ? [data.teamExtremes.happiest] : []),
  ].filter((t) => t && !t.suppressed && t.owi != null);
  const zeroCoral = teamCells.length > 0 && teamCells.every((t) => (t.owi as number) >= 55);

  return (
    <div className="space-y-8 pb-2">
      <ProjectRoadmap />

      <ZoneStateNotes
        firstQuarter={isFirstQuarter}
        stale={isStale}
        lowConfidence={isLowConfidence}
        celebration={zeroCoral}
      />

      {/* ── Headline band — OWI hero + companion KPIs ─────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="This quarter" meta={<FreshnessStamp freshness={data.freshness} />} />
        <Panel className="grid md:grid-cols-4">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OwiHero value={kpis.wellnessScore} pendingNote="OWI weighting sign-off" />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <HeadlineStat
              label="High stress"
              value={kpis.highStressPct}
              unit="%"
              pendingNote="needs PSS-10 in the battery"
              hint="PSS ≥ 68 share"
              alert={highStressBreached ? "above 20% threshold" : undefined}
            />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <HeadlineStat
              label="Burnout risk"
              value={kpis.burnoutRiskPct}
              unit="%"
              pendingNote="OBI p75/p90 set after Wave-1 (B3)"
              hint="OBI ≥ p75 share"
            />
          </div>
          <div className="p-6">
            <HeadlineStat
              label="Therapy utilization"
              value={kpis.therapyUtilizationPct}
              unit="%"
              pendingNote="needs session-booking data"
              hint="% attended ≥ 1 session"
            />
          </div>
        </Panel>
      </section>

      {/* ── Insights — finding → play → receipt ───────────────────────────── */}
      <InsightsSection period={filters.period} />

      {/* ── Workforce shape — segmentation + by level ─────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Workforce shape" meta="k≥5 · sub-k suppressed" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <SegmentationCell data={data.segmentation} />
          </div>
          <div className="p-6">
            <ByLevelCell data={data.byLevel} />
          </div>
        </Panel>
      </section>

      {/* ── Adoption & care — North-Star + WS-L bridge row ────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Adoption & care" />
        <Panel className="grid md:grid-cols-4">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <NorthStarCell period={filters.period} />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <CareEngagedCell care={care.data} loading={care.isLoading} />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <div className="flex h-full flex-col gap-1.5">
              <MicroLabel>Recovery-yield / 1k</MicroLabel>
              <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
              <span className="text-[12px] leading-4 text-slate-500">
                accruing — needs a 2nd published quarter (WS-K)
              </span>
              <div className="mt-auto pt-1">
                <Foot>reliable-change recoveries per 1,000 covered lives</Foot>
              </div>
            </div>
          </div>
          <div className="p-6">
            <ExecPsafetyCell psafety={psafety.data} loading={psafety.isLoading} />
          </div>
        </Panel>
      </section>

      {/* ── Assessment coverage ───────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Assessment coverage" />
        <CoverageSection data={data.coverage} />
      </section>

      {/* ── Team extremes ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Team extremes" meta="a team appears at 5+ respondents" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <TeamCell title="Most vulnerable team" team={data.teamExtremes.mostVulnerable} />
          </div>
          <div className="p-6">
            <TeamCell title="Happiest team" team={data.teamExtremes.happiest} />
          </div>
        </Panel>
      </section>

      {/* ── Trajectory — trends, quadrant, burnout journey ────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Trajectory" meta="org-grain · k≥5 · suppressed points are gaps" />
        <Panel className="grid lg:grid-cols-2">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
            <TrendsCell />
          </div>
          <div className="p-6">
            <QuadrantCell period={filters.period} />
          </div>
        </Panel>
        <BurnoutJourneyStrip />
      </section>
    </div>
  );
}

/* ── zone state notes ────────────────────────────────────────────────────── */

function ZoneStateNotes({
  firstQuarter,
  stale,
  lowConfidence,
  celebration,
}: {
  firstQuarter: boolean;
  stale: boolean;
  lowConfidence: boolean;
  celebration: boolean;
}) {
  const notes: { tone: string; text: string }[] = [];
  if (firstQuarter)
    notes.push({
      tone: "var(--brand-muted)",
      text: "Your starting point — trends begin next quarter. This baseline is what we measure progress against.",
    });
  if (stale)
    notes.push({
      tone: SEVERITY.amber,
      text: "Campaign window is open — showing last quarter; refreshes on close. The deliberate delay is a privacy feature.",
    });
  if (lowConfidence)
    notes.push({
      tone: SEVERITY.amber,
      text: "Participation is low this period — treat these numbers as directional.",
    });
  if (celebration)
    notes.push({
      tone: SEVERITY.green,
      text: "Milestone: no team is in the coral band this quarter. Progress deserves acknowledging.",
    });
  if (notes.length === 0) return null;

  return (
    <div className="space-y-1.5 px-1">
      {notes.map((n, i) => (
        <p key={i} className="flex items-start gap-2 text-[13px] leading-5 text-slate-600">
          <span
            aria-hidden
            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: n.tone }}
          />
          {n.text}
        </p>
      ))}
    </div>
  );
}

/* ── headline band ───────────────────────────────────────────────────────── */

const OWI_BAND_LABEL: Record<string, string> = {
  green: "Green band",
  amber: "Amber band",
  coral: "Coral band",
};

/** Thin half-arc gauge — hand-drawn SVG, 6px stroke, severity hue on the arc only. */
function OwiHero({ value, pendingNote }: { value: number | null; pendingNote: string }) {
  const pending = value === null;
  const color = pending ? "var(--brand-border)" : SEVERITY[owiBand(value)];
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Wellness score · OWI</MicroLabel>
      <div className="relative mt-1 w-full max-w-[190px]">
        <svg viewBox="0 0 120 62" className="w-full">
          <path
            d="M 8 58 A 52 52 0 0 1 112 58"
            fill="none"
            stroke="var(--brand-border)"
            strokeOpacity="0.55"
            strokeWidth="6"
            strokeLinecap="round"
            pathLength="100"
          />
          {!pending && (
            <path
              d="M 8 58 A 52 52 0 0 1 112 58"
              fill="none"
              stroke={color}
              strokeWidth="6"
              strokeLinecap="round"
              pathLength="100"
              strokeDasharray={`${value} 100`}
            />
          )}
        </svg>
        <div className="absolute inset-x-0 bottom-0 flex items-baseline justify-center gap-1">
          <span
            className={cn(
              "text-[34px] font-semibold leading-none tracking-[-0.02em] tabular-nums",
              pending ? "text-slate-300" : "text-slate-900",
            )}
          >
            {pending ? "—" : value}
          </span>
          {!pending && <span className="text-[13px] text-slate-400">/100</span>}
        </div>
      </div>
      <div className="mt-1.5">
        {pending ? (
          <span className="text-[12px] text-slate-500">pending — {pendingNote}</span>
        ) : (
          <BandDot color={color} label={OWI_BAND_LABEL[owiBand(value)] ?? ""} />
        )}
      </div>
      <div className="mt-auto pt-1">
        <Foot>Green ≥ 70 · Amber 55–69 · Coral &lt; 55</Foot>
      </div>
    </div>
  );
}

function HeadlineStat({
  label,
  value,
  unit,
  hint,
  pendingNote,
  alert,
}: {
  label: string;
  value: number | null;
  unit?: string;
  hint?: string;
  pendingNote?: string;
  alert?: string;
}) {
  const pending = value === null;
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {pending ? (
        <>
          <span className="text-[34px] font-semibold leading-10 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">pending — {pendingNote}</span>
        </>
      ) : (
        <>
          <span className="text-[34px] font-semibold leading-10 tracking-[-0.02em] tabular-nums text-slate-900">
            {value}
            {unit && <span className="ml-0.5 text-[17px] font-medium text-slate-400">{unit}</span>}
          </span>
          {alert ? (
            <BandDot color={SEVERITY.red} label={alert} />
          ) : (
            hint && <span className="text-[12px] leading-4 text-slate-500">{hint}</span>
          )}
        </>
      )}
      {!pending && alert && hint && (
        <span className="text-[12px] leading-4 text-slate-500">{hint}</span>
      )}
    </div>
  );
}

/* ── insights ────────────────────────────────────────────────────────────── */

function InsightsSection({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgInsights(period);
  return (
    <section className="space-y-3">
      <SectionHeader title="What changed — and one thing to try" />
      {isLoading ? (
        <PanelSkeleton className="h-32" />
      ) : isError ? (
        <Panel className="px-6 py-6">
          <p className="text-[13px] text-slate-400">Insights are unavailable right now.</p>
        </Panel>
      ) : !data || data.length === 0 ? (
        <Panel className="px-6 py-6">
          <p className="text-[13px] text-slate-400">
            No insights this quarter — nothing crossed a threshold or moved materially.
          </p>
        </Panel>
      ) : (
        <Panel className={cn("grid", data.length > 1 && "md:grid-cols-3")}>
          {data.map((card, i) => (
            <div
              key={card.id}
              className={cn(
                "p-6",
                i < data.length - 1 && "border-b border-slate-100 md:border-b-0 md:border-r",
              )}
            >
              <InsightCell card={card} />
            </div>
          ))}
        </Panel>
      )}
    </section>
  );
}

function InsightCell({ card }: { card: InsightCardT }) {
  return (
    <div className="flex h-full flex-col gap-2.5">
      <p className="flex items-start gap-2 text-[13.5px] font-medium leading-snug text-slate-900">
        <span
          aria-hidden
          className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: SEVERITY[card.severity] }}
        />
        {card.finding}
      </p>
      <p className="pl-3.5 text-[12.5px] leading-relaxed text-slate-500">
        <span className="font-medium text-slate-700">Try</span> — {card.play}
      </p>
      <div className="mt-auto pl-3.5 pt-1">
        {card.receipt ? (
          <BandDot color={SEVERITY.green} label={card.receipt} />
        ) : (
          <Foot>Receipt appears once a play is completed and re-measured.</Foot>
        )}
      </div>
    </div>
  );
}

/* ── workforce shape ─────────────────────────────────────────────────────── */

function SegmentationCell({ data }: { data: SegmentationSlice[] }) {
  const visible = data.filter((s) => !s.suppressed && s.pct !== null);
  return (
    <div className="flex h-full flex-col gap-3">
      <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
        Employee segmentation
        <span className="ml-1.5 font-normal text-slate-400">perceived stress</span>
      </h4>
      {visible.length === 0 ? (
        <>
          <div className="mt-1 flex h-1.5 w-full max-w-[260px] overflow-hidden rounded-full opacity-25">
            <div className="h-full w-1/2" style={{ backgroundColor: SEVERITY.green }} />
            <div className="h-full w-1/3" style={{ backgroundColor: SEVERITY.amber }} />
            <div className="h-full w-1/6" style={{ backgroundColor: SEVERITY.coral }} />
          </div>
          <p className="text-[13px] leading-relaxed text-slate-400">
            Not available yet — unlocks once PSS-10 is part of the campaign battery and at least 5
            people respond.
          </p>
        </>
      ) : (
        <>
          <div className="flex h-1.5 w-full overflow-hidden rounded-full">
            {visible.map((s, i) => (
              <div
                key={s.label}
                className={cn("h-full", i > 0 && "ml-px")}
                style={{ width: `${s.pct}%`, backgroundColor: stressBucketColor(s.label) }}
                title={`${s.label}: ${s.pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {data.map((s) => (
              <span key={s.label} className="inline-flex items-center gap-1.5 text-[12.5px]">
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: stressBucketColor(s.label) }}
                />
                <span className="text-slate-500">{s.label}</span>
                <span className="font-medium tabular-nums text-slate-900">
                  {s.suppressed || s.pct === null ? "—" : `${s.pct}%`}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ByLevelCell({ data }: { data: ByLevelOwi[] }) {
  const hasData = data.some((r) => !r.suppressed && r.owi !== null);
  return (
    <div className="flex h-full flex-col gap-3">
      <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
        Wellness score by level
      </h4>
      {data.length === 0 || !hasData ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — per-level wellbeing unlocks once the OWI weighting is clinically signed off.
          Cohorts under 5 stay suppressed.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {data.map((row) => (
            <div key={row.level} className="flex items-center gap-3">
              <span className="w-7 text-[12.5px] font-medium text-slate-500">{row.level}</span>
              {row.suppressed || row.owi === null ? (
                <span className="flex-1 text-[12.5px] text-slate-400">below threshold</span>
              ) : (
                <>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.owi}%`,
                        backgroundColor: SEVERITY[owiBand(row.owi)],
                      }}
                    />
                  </div>
                  <span className="w-10 text-right text-[13px] font-medium tabular-nums text-slate-900">
                    {row.owi}
                  </span>
                </>
              )}
              <span className="w-12 text-right text-[11.5px] tabular-nums text-slate-400">
                n={row.n}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── adoption & care ─────────────────────────────────────────────────────── */

function NorthStarCell({ period }: { period: string }) {
  const q = useEngagedCoveredLives(period);
  const data = q.data;
  if (q.isLoading) return <div className="h-24 skeleton rounded-lg" />;
  if (q.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load — refresh to retry.
      </p>
    );

  const suppressed = data?.suppressed ?? true;
  const ratePct = data?.engagedRate != null ? Math.round(data.engagedRate * 1000) / 10 : null;

  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Engaged covered lives · North-Star</MicroLabel>
      {suppressed || !data ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Lights up once at least {data?.k ?? 5} covered lives have engaged — a count, aggregate
          only, never an individual.
        </p>
      ) : (
        <>
          <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
            {data.engagedLives}
            <span className="ml-1 text-[14px] font-normal text-slate-400">
              / {data.coveredLives}
            </span>
          </span>
          {ratePct != null && (
            <span className="text-[12px] leading-4 text-slate-500">
              {ratePct}% engaged this quarter · ≥1 meaningful interaction
            </span>
          )}
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>Governed North-Star metric · count-only · k≥{data?.k ?? 5} · aggregate.</Foot>
      </div>
    </div>
  );
}

function CareEngagedCell({
  care,
  loading,
}: {
  care:
    | {
        status: string;
        engagedPct?: number | null;
        engagedMembers?: number | null;
        eligibleMembers?: number | null;
      }
    | undefined;
  loading: boolean;
}) {
  if (loading) return <div className="h-24 skeleton rounded-lg" />;
  const live = care?.status === "live";
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Care-engaged</MicroLabel>
      {live ? (
        <>
          <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
            {care!.engagedPct}
            <span className="ml-0.5 text-[14px] font-medium text-slate-400">%</span>
          </span>
          <span className="text-[12px] leading-4 text-slate-500">
            {care!.engagedMembers}/{care!.eligibleMembers} members used funded care
          </span>
        </>
      ) : care?.status === "suppressed" ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Below reporting threshold — suppressed for anonymity.
        </p>
      ) : (
        <>
          <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">
            pending — no employer-tagged bookings yet
          </span>
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>% of members who used ≥1 funded session.</Foot>
      </div>
    </div>
  );
}

const PSAFETY_BAND_TONE: Record<string, string> = {
  strong: SEVERITY.green,
  steady: SEVERITY.amber,
  building: "var(--brand-muted)",
};

function ExecPsafetyCell({
  psafety,
  loading,
}: {
  psafety: ExecTeamPsafety | undefined;
  loading: boolean;
}) {
  if (loading || !psafety) return <div className="h-24 skeleton rounded-lg" />;
  const live = psafety.status === "live";
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>Exec-team psych-safety</MicroLabel>
      {live ? (
        <>
          <span className="flex items-baseline gap-2">
            <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
              {psafety.value}
            </span>
            {psafety.band && (
              <BandDot
                color={PSAFETY_BAND_TONE[psafety.band] ?? "var(--brand-muted)"}
                label={psafety.band}
              />
            )}
          </span>
          {psafety.delta != null && psafety.priorPeriod && (
            <span className="text-[12px] leading-4 tabular-nums text-slate-500">
              {psafety.delta >= 0 ? "+" : ""}
              {psafety.delta} vs {psafety.priorPeriod} · the leadership team&apos;s own number
            </span>
          )}
        </>
      ) : (
        <>
          <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">
            {psafety.status === "suppressed" ? "below reporting threshold" : "pending"} —{" "}
            {psafety.detail}
          </span>
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>Edmondson · org-grain · calm gradient (no alert).</Foot>
      </div>
    </div>
  );
}

/* ── assessment coverage ─────────────────────────────────────────────────── */

function CoverageSection({ data }: { data: CoverageTile[] }) {
  const participation = data.find((t) => /participation/i.test(t.instrument));
  const pct = participation && !participation.suppressed ? participation.completedPct : null;
  const others = data.filter((t) => t !== participation);
  const TARGET = 70;

  return (
    <Panel className="p-6">
      {pct !== null && pct !== undefined ? (
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:gap-10">
          <div className="shrink-0">
            <MicroLabel>Participation</MicroLabel>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-[34px] font-semibold leading-10 tracking-[-0.02em] tabular-nums text-slate-900">
                {pct}
                <span className="ml-0.5 text-[17px] font-medium text-slate-400">%</span>
              </span>
              <BandDot
                color={pct >= TARGET ? SEVERITY.green : SEVERITY.amber}
                label={pct >= TARGET ? "at / above target" : `below ${TARGET}% target`}
              />
            </div>
          </div>
          <div className="flex-1 pb-1.5">
            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${pct}%`,
                  backgroundColor: pct >= TARGET ? SEVERITY.green : "var(--brand-primary)",
                }}
              />
              <div
                className="absolute top-0 h-full w-px bg-slate-400"
                style={{ left: `${TARGET}%` }}
                title={`${TARGET}% target`}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] tabular-nums text-slate-400">
              <span>0%</span>
              <span>target {TARGET}%</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Coverage not available yet — participation appears once a campaign closes and a snapshot
          is frozen.
        </p>
      )}

      {others.length > 0 && (
        <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-slate-100 pt-5 sm:grid-cols-4">
          {others.map((t) => (
            <div key={t.instrument} className="flex flex-col gap-1">
              <MicroLabel>{t.instrument}</MicroLabel>
              <span className="text-[20px] font-semibold leading-7 tabular-nums text-slate-900">
                {t.suppressed || t.completedPct === null ? (
                  <span className="text-[12.5px] font-normal text-slate-400">below threshold</span>
                ) : (
                  `${t.completedPct}%`
                )}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4">
        <Foot>
          Drill into the named Participation Tracker for who has / hasn&apos;t completed (status
          only).
        </Foot>
      </div>
    </Panel>
  );
}

/* ── team extremes ───────────────────────────────────────────────────────── */

function TeamCell({ title, team }: { title: string; team: TeamExtreme | null }) {
  const empty = !team || team.suppressed || team.owi === null;
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{title}</MicroLabel>
      {empty ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          No team meets the threshold yet — a team appears here once 5+ of its members respond,
          protecting anonymity.
        </p>
      ) : (
        <>
          <span className="text-[15px] font-medium text-slate-900">{team!.team}</span>
          <span className="flex items-baseline gap-2">
            <span
              className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
              style={{ color: SEVERITY[owiBand(team!.owi as number)] }}
            >
              {team!.owi}
            </span>
            <span className="text-[12px] tabular-nums text-slate-400">OWI · n={team!.n}</span>
          </span>
        </>
      )}
    </div>
  );
}

/* ── trajectory ──────────────────────────────────────────────────────────── */

const TREND_SERIES: { key: MetricKey; label: string; color: string }[] = [
  { key: "PARTICIPATION_PCT", label: "Participation", color: "var(--brand-primary)" },
  { key: "RESPONSE_VALIDITY_RATE", label: "Validity", color: SEVERITY.amber },
  { key: "TRUST_QUOTIENT", label: "Trust", color: SEVERITY.green },
];

function TrendsCell() {
  const part = useMetricTrend("PARTICIPATION_PCT");
  const valid = useMetricTrend("RESPONSE_VALIDITY_RATE");
  const trust = useMetricTrend("TRUST_QUOTIENT");

  if (part.isLoading || valid.isLoading || trust.isLoading)
    return <div className="h-64 skeleton rounded-lg" />;
  if (part.isError || valid.isError || trust.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load trends — refresh to retry.
      </p>
    );

  const periods = Array.from(
    new Set([part.data, valid.data, trust.data].flatMap((s) => (s ?? []).map((p) => p.period))),
  ).sort();
  const idx = (s: TrendPoint[] | undefined) => new Map((s ?? []).map((p) => [p.period, p.value]));
  const mp = idx(part.data),
    mv = idx(valid.data),
    mt = idx(trust.data);
  const rows = periods.map((period) => ({
    period,
    PARTICIPATION_PCT: mp.get(period) ?? null,
    RESPONSE_VALIDITY_RATE: mv.get(period) ?? null,
    TRUST_QUOTIENT: mt.get(period) ?? null,
  }));

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
          Quarter-over-quarter trends
        </h4>
        <span className="flex items-center gap-4">
          {TREND_SERIES.map((s) => (
            <span key={s.key} className="inline-flex items-center gap-1.5 text-[11.5px] text-slate-500">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </span>
      </div>
      {rows.length < 2 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Need at least two published quarters to show a trend. One snapshot so far.
        </p>
      ) : (
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 0, left: -16 }}>
              <CartesianGrid stroke="rgba(15,23,42,0.04)" vertical={false} />
              <XAxis
                dataKey="period"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(15,23,42,0.12)",
                }}
              />
              {TREND_SERIES.map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.label}
                  stroke={s.color}
                  strokeWidth={2}
                  dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function quadrantColor(p: QuadrantPoint): string {
  const stressed = (p.stress ?? 0) >= 50;
  const engaged = (p.engagement ?? 0) >= 50;
  if (!stressed && engaged) return SEVERITY.green; // Thriving
  if (stressed && engaged) return SEVERITY.amber; // Straining
  if (!stressed && !engaged) return SEVERITY.amber; // Coasting
  return SEVERITY.coral; // Burning
}

function QuadrantCell({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgQuadrant(period, "DEPARTMENT");
  const points = data ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
          Stress × engagement
        </h4>
        <span className="text-[11.5px] text-slate-400">by department · k≥5</span>
      </div>
      {isLoading ? (
        <div className="h-60 skeleton rounded-lg" />
      ) : isError ? (
        <p className="text-[13px] text-slate-400">The quadrant is unavailable right now.</p>
      ) : points.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Building — each department plots here once perceived stress (PSS-10 high share) and work
          engagement (UWES) are both live at k≥5. A cohort appears only when both are known; we
          never guess a position.
        </p>
      ) : (
        <div className="relative">
          {(
            [
              [60, 18, "Burning"],
              [undefined, 18, "Straining"],
              [60, undefined, "Coasting"],
              [undefined, undefined, "Thriving"],
            ] as const
          ).map(([left, top, text]) => (
            <span
              key={text}
              className="pointer-events-none absolute z-10 text-[10px] font-medium uppercase tracking-[0.08em] text-slate-300"
              style={{
                left: left ?? undefined,
                right: left === undefined ? 24 : undefined,
                top: top ?? undefined,
                bottom: top === undefined ? 68 : undefined,
              }}
            >
              {text}
            </span>
          ))}
          <ResponsiveContainer width="100%" height={248}>
            <ScatterChart margin={{ top: 14, right: 16, bottom: 4, left: -16 }}>
              <XAxis
                type="number"
                dataKey="stress"
                name="Stress"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="number"
                dataKey="engagement"
                name="Engagement"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <ZAxis type="number" dataKey="n" range={[70, 320]} name="cohort size" />
              <ReferenceLine x={50} stroke="rgba(15,23,42,0.08)" />
              <ReferenceLine y={50} stroke="rgba(15,23,42,0.08)" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 10,
                  border: "none",
                  boxShadow: "0 4px 16px rgba(15,23,42,0.12)",
                }}
                formatter={(value: number, name: string) => [`${value}`, name]}
                labelFormatter={() => ""}
              />
              <Scatter data={points} isAnimationActive={false}>
                {points.map((p) => (
                  <Cell
                    key={p.grainRef ?? p.label}
                    fill={quadrantColor(p)}
                    fillOpacity={0.85}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
          <p className="mt-1.5 text-center text-[11px] text-slate-400">
            stress → · engagement ↑ · point size = cohort n
          </p>
        </div>
      )}
    </div>
  );
}

/** Burnout Journey — BRI over time at org grain, lower is better. Honest-pending. */
function BurnoutJourneyStrip() {
  const trend = useMetricTrend("BRI");
  const points = (trend.data ?? []).filter((p) => !p.suppressed && p.value != null);
  const latest = points[points.length - 1];
  const prior = points.length >= 2 ? points[points.length - 2] : null;
  const delta =
    latest && prior && latest.value != null && prior.value != null
      ? Math.round((latest.value - prior.value) * 10) / 10
      : null;

  return (
    <Panel className="flex flex-col gap-3 p-6 md:flex-row md:items-center md:justify-between">
      <div className="flex flex-col gap-1.5">
        <MicroLabel>Burnout journey · BRI</MicroLabel>
        {trend.isLoading ? (
          <div className="h-10 w-32 skeleton rounded-lg" />
        ) : !latest ? (
          <p className="text-[13px] leading-relaxed text-slate-400">
            Pending — BRI appears once the metric is published and a quarter clears the reporting
            threshold.
          </p>
        ) : (
          <span className="flex items-baseline gap-2.5">
            <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
              {latest.value}
            </span>
            {delta != null && (
              <span className="text-[12px] tabular-nums text-slate-500">
                {delta >= 0 ? "+" : ""}
                {delta} vs {prior?.period}
              </span>
            )}
          </span>
        )}
      </div>
      <div className="flex flex-col items-start gap-1.5 md:items-end">
        {latest && (
          <span className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] tabular-nums text-slate-500">
            {points.map((p) => (
              <span key={p.period}>
                {p.period} · {p.value}
              </span>
            ))}
          </span>
        )}
        <Foot>org-grain · lower is better</Foot>
      </div>
    </Panel>
  );
}
