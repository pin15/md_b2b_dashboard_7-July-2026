# Overview Dashboard — source bundle

> Generated 2026-06-27 02:47 from `b2b-dashboard/`. Every file backing
> **`/dashboard?tab=overview`** — the render chain, the cards it composes, the shell
> chrome, and the shared style/util files. Paths are relative to the `b2b-dashboard` repo root.
> _Data-layer hooks (`src/lib/hooks/*`) are intentionally excluded — this is the UI set._

## Render chain

```
app/(app)/dashboard/page.tsx   (route, <Suspense>)
  └─ components/dashboard/DashboardView.tsx   (header · FilterBar · TabNav · tab switch)
       └─ components/dashboard/tabs/OverviewTab.tsx   (the tab=overview content)
            └─ OwiGauge · KpiCard · OverviewWidgets · EngagedCoveredLivesCard ·
               InsightRail · MotionQuadrant · TrendChart · ProjectRoadmap · FreshnessStamp
  chrome: components/layout/AppShell.tsx (rail + topbar + app-bar filters)
  shared: components/ui/primitives.tsx · ui/Dropdown.tsx · lib/severity.ts · lib/utils.ts · app/globals.css
```

## Contents

- [`src/app/(app)/dashboard/page.tsx`](#src-app-app-dashboard-page-tsx)
- [`src/components/dashboard/DashboardView.tsx`](#src-components-dashboard-dashboardview-tsx)
- [`src/components/dashboard/tabs/OverviewTab.tsx`](#src-components-dashboard-tabs-overviewtab-tsx)
- [`src/components/dashboard/FilterBar.tsx`](#src-components-dashboard-filterbar-tsx)
- [`src/components/dashboard/Tabs.tsx`](#src-components-dashboard-tabs-tsx)
- [`src/components/dashboard/DataConfidenceStrip.tsx`](#src-components-dashboard-dataconfidencestrip-tsx)
- [`src/components/dashboard/ProjectRoadmap.tsx`](#src-components-dashboard-projectroadmap-tsx)
- [`src/components/dashboard/FreshnessStamp.tsx`](#src-components-dashboard-freshnessstamp-tsx)
- [`src/components/dashboard/InsightRail.tsx`](#src-components-dashboard-insightrail-tsx)
- [`src/components/dashboard/OwiGauge.tsx`](#src-components-dashboard-owigauge-tsx)
- [`src/components/dashboard/KpiCard.tsx`](#src-components-dashboard-kpicard-tsx)
- [`src/components/dashboard/OverviewWidgets.tsx`](#src-components-dashboard-overviewwidgets-tsx)
- [`src/components/dashboard/EngagedCoveredLivesCard.tsx`](#src-components-dashboard-engagedcoveredlivescard-tsx)
- [`src/components/dashboard/MotionQuadrant.tsx`](#src-components-dashboard-motionquadrant-tsx)
- [`src/components/dashboard/TrendChart.tsx`](#src-components-dashboard-trendchart-tsx)
- [`src/components/layout/AppShell.tsx`](#src-components-layout-appshell-tsx)
- [`src/components/ui/primitives.tsx`](#src-components-ui-primitives-tsx)
- [`src/components/ui/Dropdown.tsx`](#src-components-ui-dropdown-tsx)
- [`src/lib/severity.ts`](#src-lib-severity-ts)
- [`src/lib/utils.ts`](#src-lib-utils-ts)
- [`src/app/globals.css`](#src-app-globals-css)

---

<a id="src-app-app-dashboard-page-tsx"></a>

## `src/app/(app)/dashboard/page.tsx`

````tsx
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { DashboardView } from "@/components/dashboard/DashboardView";

// useSearchParams (in the filter/tab hooks) requires a Suspense boundary.
export default function DashboardPage() {
  return (
    <Suspense fallback={<Skeleton className="h-96 w-full rounded-xl" />}>
      <DashboardView />
    </Suspense>
  );
}
````

<a id="src-components-dashboard-dashboardview-tsx"></a>

## `src/components/dashboard/DashboardView.tsx`

````tsx
"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { TabNav } from "@/components/dashboard/Tabs";
import { DataConfidenceStrip } from "@/components/dashboard/DataConfidenceStrip";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { HealthRiskTab } from "@/components/dashboard/tabs/HealthRiskTab";
import { EngagementTab } from "@/components/dashboard/tabs/EngagementTab";
import { ImpactTab } from "@/components/dashboard/tabs/ImpactTab";
import { VerifyTab } from "@/components/dashboard/tabs/VerifyTab";
import { ActTab } from "@/components/dashboard/tabs/ActTab";
import { GovernTab } from "@/components/dashboard/tabs/GovernTab";
import { Heartbeat } from "@phosphor-icons/react";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import type { DashboardFilters } from "@/lib/graphql/types";

const DEFAULT_PERIOD = "2026-Q2";

export function DashboardView() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const filters: DashboardFilters = {
    period: state.period,
    department: state.department,
    level: state.level,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">
            Employer Wellbeing Dashboard
          </h1>
          <p className="text-sm text-brand-muted">
            Aggregate insight (k≥5) — no individual responses, scores, or risk.
          </p>
        </div>
        <a
          href={`/report?period=${filters.period}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1E3A5F] px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:bg-[#162d4a] hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2"
        >
          <Heartbeat weight="duotone" className="h-[18px] w-[18px] text-white/90" />
          Health Report
        </a>
      </div>

      {/* Filters move into the app bar on xl+ (see AppShell); this is the body
          fallback for smaller screens where the bar has no room. */}
      <div className="xl:hidden">
        <FilterBar defaultPeriod={DEFAULT_PERIOD} />
      </div>
      <DataConfidenceStrip period={filters.period} />
      {/* Tabs live in the sidebar rail on md+; this is the phone fallback (rail hidden). */}
      <div className="md:hidden">
        <TabNav defaultPeriod={DEFAULT_PERIOD} />
      </div>

      {state.tab === "overview" && <OverviewTab filters={filters} />}
      {state.tab === "health" && <HealthRiskTab filters={filters} />}
      {state.tab === "engagement" && <EngagementTab filters={filters} />}
      {state.tab === "impact" && <ImpactTab filters={filters} />}
      {state.tab === "verify" && <VerifyTab filters={filters} />}
      {state.tab === "act" && <ActTab filters={filters} />}
      {state.tab === "govern" && <GovernTab filters={filters} />}
    </div>
  );
}
````

<a id="src-components-dashboard-tabs-overviewtab-tsx"></a>

## `src/components/dashboard/tabs/OverviewTab.tsx`

````tsx
"use client";

import {
  useOverview,
  useOrgCareEngagement,
  useExecTeamPsafety,
  useDataConfidence,
  useMetricTrend,
} from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Badge, Skeleton, StatusDot } from "@/components/ui/primitives";
import { KpiCard } from "@/components/dashboard/KpiCard";
import { SEVERITY } from "@/lib/severity";
import { ShieldCheck } from "lucide-react";
import type { ExecTeamPsafety } from "@/lib/graphql/types";
import { OwiGauge } from "@/components/dashboard/OwiGauge";
import { FreshnessStamp } from "@/components/dashboard/FreshnessStamp";
import {
  SegmentationBar,
  ByLevelBars,
  CoverageTiles,
  TeamExtremes,
} from "@/components/dashboard/OverviewWidgets";
import { ProjectRoadmap } from "@/components/dashboard/ProjectRoadmap";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { InsightRail } from "@/components/dashboard/InsightRail";
import { MotionQuadrant } from "@/components/dashboard/MotionQuadrant";
import { EngagedCoveredLivesCard } from "@/components/dashboard/EngagedCoveredLivesCard";
import type { DashboardFilters } from "@/lib/graphql/types";

// ── WS-L residual Bridge surface (b2b_77): Care-engaged %, Recovery-Yield (accruing),
// and the leadership team's own psych-safety card. Honest-or-pending throughout.

/**
 * Overview tab — the Phase-1 acceptance surface. Renders entirely from the
 * GraphQL `overview` query (mock-first). Suppressed cells show "below reporting
 * threshold"; the burnout KPI is intentionally a "pending" tile pre-Wave-1 (B3),
 * never a fabricated %.
 */
export function OverviewTab({ filters }: { filters: DashboardFilters }) {
  const { data, isLoading, isError, error } = useOverview(filters);
  const care = useOrgCareEngagement(filters.period);
  const psafety = useExecTeamPsafety(filters.period);
  const confidence = useDataConfidence(filters.period);
  // first-quarter detection: a published OWI trend with < 2 points → no QoQ yet.
  const owiTrend = useMetricTrend("OWI");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <ProjectRoadmap />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <ProjectRoadmap />
        <div className="rounded-xl border border-severity-red/30 bg-severity-red/10 p-4 text-sm text-severity-red">
          Could not load the overview. {error instanceof Error ? error.message : ""}
        </div>
      </div>
    );
  }

  const { kpis } = data;
  const highStressBreached = (kpis.highStressPct ?? 0) > 20; // discrete alert → red OK

  // ── 7 universal widget states for the Overview ZONE (WS-L residual). Every signal
  //    is read from REAL data — none is fabricated. The banner self-caveats the whole
  //    zone so HR never reads a number without its state.
  const trendPoints = (owiTrend.data ?? []).filter((p) => !p.suppressed && p.value != null);
  const isFirstQuarter = !owiTrend.isLoading && trendPoints.length < 2;
  const isStale = data.freshness.status === "stale";
  const isLowConfidence = confidence.data?.lowConfidence === true;
  // celebration: a real milestone — zero teams reading "coral" this quarter (and we
  // actually have team data to say so). Calm green, never red.
  const teamCells = [
    ...(data.teamExtremes.mostVulnerable ? [data.teamExtremes.mostVulnerable] : []),
    ...(data.teamExtremes.happiest ? [data.teamExtremes.happiest] : []),
  ].filter((t) => t && !t.suppressed && t.owi != null);
  const zeroCoral =
    teamCells.length > 0 && teamCells.every((t) => (t.owi as number) >= 55);

  return (
    <div className="space-y-4">
      <ProjectRoadmap />

      <div className="flex justify-end">
        <FreshnessStamp freshness={data.freshness} />
      </div>

      <OverviewStateBanner
        firstQuarter={isFirstQuarter}
        stale={isStale}
        lowConfidence={isLowConfidence}
        celebration={zeroCoral}
      />

      <InsightRail period={filters.period} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <OwiGauge value={kpis.wellnessScore} pendingNote="OWI weighting sign-off" />
        <KpiCard
          title="% High Stress"
          value={kpis.highStressPct}
          unit="%"
          alert={highStressBreached}
          pendingNote="needs PSS-10 in the battery"
          footer={highStressBreached ? "Above 20% threshold" : "PSS ≥ 68 share"}
        />
        <KpiCard
          title="% Burnout Risk"
          value={kpis.burnoutRiskPct}
          unit="%"
          pendingNote="OBI p75/p90 set after Wave-1 (B3)"
          footer="OBI ≥ p75 share"
        />
        <KpiCard
          title="Therapy Utilization"
          value={kpis.therapyUtilizationPct}
          unit="%"
          pendingNote="needs session-booking data"
          footer="% attended ≥ 1 session"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SegmentationBar data={data.segmentation} />
        <ByLevelBars data={data.byLevel} />
      </div>

      {/* North-Star headline (WS-C C): "are people actually using this?" — engaged
          covered lives, count-only + aggregate-only (k≥5 in-DB). Honest-or-pending:
          shows the dignity tile until the engaged numerator clears the k floor. */}
      <div className="grid gap-4 lg:grid-cols-2">
        <EngagedCoveredLivesCard period={filters.period} />
      </div>

      {/* WS-L Bridge surface (b2b_77): the "are they using it?" + "do leaders feel safe?"
          row. Honest-or-pending — Care-engaged % reads pending until booking data lands;
          Recovery-Yield/1k is honestly "accruing" until WS-K publishes it; the exec
          psych-safety card is pending until Edmondson publishes. Nothing is fabricated. */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Care-engaged %"
          value={care.data?.status === "live" ? care.data.engagedPct : null}
          unit="%"
          suppressed={care.data?.status === "suppressed"}
          pendingNote={
            care.data?.status === "pending"
              ? "no employer-tagged bookings yet"
              : undefined
          }
          footer={
            care.data?.status === "live"
              ? `${care.data.engagedMembers}/${care.data.eligibleMembers} members used funded care`
              : "% of members who used ≥1 funded session"
          }
        />
        <KpiCard
          title="Recovery-Yield / 1k"
          value={null}
          pendingNote="accruing — needs a 2nd published quarter (WS-K)"
          footer="reliable-change recoveries per 1,000 covered lives"
        />
        <ExecPsafetyCard psafety={psafety.data} loading={psafety.isLoading} />
      </div>

      <CoverageTiles data={data.coverage} />

      <TeamExtremes
        mostVulnerable={data.teamExtremes.mostVulnerable}
        happiest={data.teamExtremes.happiest}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <TrendChart />
        <MotionQuadrant period={filters.period} />
      </div>
    </div>
  );
}

/**
 * Honest zone-level state banner for the Overview (WS-L residual — the 7 universal
 * states surfaced at the zone). Each chip is driven by REAL data: first-quarter (no
 * QoQ trend yet), stale (campaign window open), low-confidence (DCS below threshold),
 * celebration (a real milestone). When the zone is plainly Live (none set) it renders
 * nothing — no noise. Suppressed/Alert states live on the individual widgets already.
 */
function OverviewStateBanner({
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
  const chips: { tone: string; text: string }[] = [];
  if (firstQuarter)
    chips.push({
      tone: "var(--brand-muted)",
      text: "Your starting point — trends begin next quarter. This baseline is what we measure progress against.",
    });
  if (stale)
    chips.push({
      tone: SEVERITY.amber,
      text: "Campaign window is open — showing last quarter; refreshes on close. The deliberate delay is a privacy feature.",
    });
  if (lowConfidence)
    chips.push({
      tone: SEVERITY.amber,
      text: "Participation is low this period — treat these numbers as directional.",
    });
  if (celebration)
    chips.push({
      tone: SEVERITY.green,
      text: "Milestone: no team is in the coral band this quarter. Progress deserves acknowledging.",
    });
  if (chips.length === 0) return null;

  return (
    <div className="space-y-2">
      {chips.map((c, i) => (
        <div
          key={i}
          className="flex items-start gap-2 rounded-xl bg-brand-surface p-3 text-sm text-brand-text shadow-card"
        >
          <StatusDot color={c.tone} className="mt-1" />
          <span>{c.text}</span>
        </div>
      ))}
    </div>
  );
}

// The leadership team's OWN psychological-safety number (Edmondson). A calm gradient —
// never a discrete red alert on this surface. Honest-pending until the metric publishes.
const PSAFETY_BAND_TONE: Record<string, string> = {
  strong: SEVERITY.green,
  steady: SEVERITY.amber,
  building: "var(--brand-muted)",
};

function ExecPsafetyCard({
  psafety,
  loading,
}: {
  psafety: ExecTeamPsafety | undefined;
  loading: boolean;
}) {
  const live = psafety?.status === "live";
  return (
    <Card className="flex h-full flex-col gap-2">
      <div className="flex items-center justify-between">
        <CardTitle>Exec-team psych-safety</CardTitle>
        <ShieldCheck className="h-4 w-4 text-brand-muted" />
      </div>
      {loading || !psafety ? (
        <Skeleton className="h-16 w-full rounded-xl" />
      ) : live ? (
        <div className="flex flex-1 flex-col justify-center gap-1">
          <div className="flex items-center gap-2">
            <span className="text-4xl font-semibold tabular-nums text-brand-text">
              {psafety.value}
            </span>
            {psafety.band && (
              <Badge color={PSAFETY_BAND_TONE[psafety.band] ?? "var(--brand-muted)"}>
                {psafety.band}
              </Badge>
            )}
          </div>
          {psafety.delta != null && psafety.priorPeriod && (
            <span className="text-xs text-brand-muted">
              {psafety.delta >= 0 ? "+" : ""}
              {psafety.delta} vs {psafety.priorPeriod} · the leadership team&apos;s own number
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-1 flex-col justify-center">
          <span className="text-sm text-brand-muted">
            {psafety.status === "suppressed" ? "Below reporting threshold" : "Pending"}
          </span>
          <p className="mt-1 text-xs text-brand-muted">{psafety.detail}</p>
        </div>
      )}
      <div className="text-xs text-brand-muted">Edmondson · org-grain · calm gradient (no alert)</div>
    </Card>
  );
}
````

<a id="src-components-dashboard-filterbar-tsx"></a>

## `src/components/dashboard/FilterBar.tsx`

````tsx
"use client";

import { useFilterOptions } from "@/lib/hooks/useDashboardData";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { Dropdown } from "@/components/ui/Dropdown";

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-brand-muted">{label}</span>
      <Dropdown value={value} onChange={onChange} options={options} minWidth={150} />
    </label>
  );
}

export function FilterBar({ defaultPeriod }: { defaultPeriod: string }) {
  const { data: opts } = useFilterOptions();
  const { state, setParam } = useUrlFilters(defaultPeriod);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-brand-surface px-5 py-3.5 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      <Field
        label="Period"
        value={state.period}
        onChange={(v) => setParam("period", v)}
        options={(opts?.periods ?? [defaultPeriod]).map((p) => ({ value: p, label: p }))}
      />
      <Field
        label="Department"
        value={state.department ?? ""}
        onChange={(v) => setParam("department", v || null)}
        options={[
          { value: "", label: "All departments" },
          ...(opts?.departments ?? []).map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
      <Field
        label="Team"
        value={state.team ?? ""}
        onChange={(v) => setParam("team", v || null)}
        options={[
          { value: "", label: "All teams" },
          ...(opts?.teams ?? []).map((t) => ({ value: t.id, label: t.label })),
        ]}
      />
      <Field
        label="Level"
        value={state.level ?? ""}
        onChange={(v) => setParam("level", v || null)}
        options={[
          { value: "", label: "All levels" },
          ...(opts?.levels ?? []).map((l) => ({ value: l.id, label: l.label })),
        ]}
      />
    </div>
  );
}
````

<a id="src-components-dashboard-tabs-tsx"></a>

## `src/components/dashboard/Tabs.tsx`

````tsx
"use client";

import { useUrlFilters } from "@/lib/hooks/useFilters";
import { cn } from "@/lib/utils";

export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "Health & Risk" },
  { id: "engagement", label: "Engagement" },
  { id: "impact", label: "Impact" },
  { id: "verify", label: "Verify" },
  { id: "act", label: "Act & Programmes" },
  { id: "govern", label: "Reports & Govern" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function TabNav({ defaultPeriod }: { defaultPeriod: string }) {
  const { state, setParam } = useUrlFilters(defaultPeriod);
  return (
    <div className="flex flex-wrap gap-1 border-b border-brand-border">
      {TABS.map((t) => {
        const active = state.tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setParam("tab", t.id)}
            className={cn(
              // B2C tab styling: navy (#1E3A5F) underline + navy label on the active
              // tab, slate-muted inactive with a navy hover. Navy is the brand
              // primary (B2C §2/§4a). Severity tones are untouched.
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              active
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-muted hover:text-brand-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
````

<a id="src-components-dashboard-dataconfidencestrip-tsx"></a>

## `src/components/dashboard/DataConfidenceStrip.tsx`

````tsx
"use client";

import { useDataConfidence } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";

/**
 * Data Confidence strip.
 * Quality, not health: DCS, Response Validity, and Trust Quotient travel WITH
 * every number so employers never read a metric in isolation.
 */
type Tone = "green" | "amber" | "coral" | "muted";

/**
 * One metric's scoring rules, co-located so the colour, label, and bar fill all
 * derive from the same source of truth. `green`/`amber` are the lower bounds for
 * those bands; below `amber` is coral. `max` is the metric's own scale so the bar
 * isn't forced onto a 0–100 percent assumption.
 */
interface MetricConfig {
  label: string;
  value: number | null;
  unit?: string;
  green: number;
  amber: number;
  max: number;
  hint: string;
}

function tone({ value, green, amber }: MetricConfig): Tone {
  if (value == null) return "muted";
  if (value >= green) return "green";
  if (value >= amber) return "amber";
  return "coral";
}

function toneColor(toneKey: Tone) {
  if (toneKey === "muted") return "var(--brand-muted)";
  return SEVERITY[toneKey];
}

function toneLabel(toneKey: Tone) {
  if (toneKey === "green") return "Reliable";
  if (toneKey === "amber") return "Directional";
  if (toneKey === "coral") return "Low";
  return "Unknown";
}

/** Bar fill as a share of the metric's own scale, clamped to 0–100. */
function fillPercent({ value, max }: MetricConfig) {
  if (value == null || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function formatValue(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1);
}

function formatDate(value?: string | null) {
  if (!value) return "k≥5 active";
  return `As of ${new Date(value).toLocaleDateString()}`;
}

function Metric({ config }: { config: MetricConfig }) {
  const { label, value, unit, hint } = config;
  const toneKey = tone(config);
  const color = toneColor(toneKey);
  const percent = fillPercent(config);

  return (
    <div className="flex min-w-[170px] flex-1 flex-col justify-between px-5 py-3 first:pl-0 last:pr-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
          {label}
        </span>

        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color }}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {toneLabel(toneKey)}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span
          className="text-[32px] font-medium leading-none tracking-[-0.055em] tabular-nums"
          style={{ color }}
        >
          {formatValue(value)}
        </span>

        {unit && value != null && (
          <span className="pb-1 text-[13px] font-medium text-brand-muted">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-black/[0.055]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            opacity: toneKey === "muted" ? 0.35 : 1,
          }}
        />
      </div>

      <p className="mt-2 max-w-[250px] truncate text-[10.5px] leading-snug text-brand-muted">
        {hint}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="h-[96px] w-full animate-pulse rounded-xl bg-brand-surface shadow-card"
      aria-hidden
    />
  );
}

export function DataConfidenceStrip({ period }: { period: string }) {
  const { data, isLoading } = useDataConfidence(period);

  if (isLoading || !data) {
    return <LoadingState />;
  }

  const metrics: MetricConfig[] = [
    {
      label: "DCS",
      value: data.dcs,
      green: 80,
      amber: 60,
      max: 100,
      hint: "Participation × validity × representativeness",
    },
    {
      label: "Response Validity",
      value: data.validityPct,
      unit: "%",
      green: 90,
      amber: 80,
      max: 100,
      hint: "RQI-passing responses · target ≥90%",
    },
    {
      label: "Trust Quotient",
      value: data.trustQuotient,
      green: 70,
      amber: 55,
      max: 100,
      hint: "Participation × validity × employee trust",
    },
  ];

  const directional = data.lowConfidence || (data.dcs != null && data.dcs < 60);

  return (
    <section
      className="w-full rounded-xl bg-brand-surface px-5 py-3 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
      style={directional ? { opacity: 0.98 } : undefined}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Left compact label */}
        <div className="flex w-full shrink-0 flex-col justify-between border-b border-brand-border pb-4 lg:w-[220px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: directional ? SEVERITY.amber : SEVERITY.green,
                }}
              />

              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Data Quality
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 lg:block">
              <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-brand-text">
                Data Confidence
              </h3>

              <span className="text-[10.5px] font-medium text-brand-muted lg:mt-1 lg:block">
                {formatDate(data.asOf)}
              </span>
            </div>

            <p className="mt-2 max-w-[200px] text-[10.5px] leading-snug text-brand-muted">
              Reliability context that travels with every reported metric.
            </p>
          </div>

          {directional && (
            <span
              className="mt-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{
                color: SEVERITY.amber,
                backgroundColor: `${SEVERITY.amber}12`,
              }}
            >
              Treat as directional
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="grid flex-1 grid-cols-1 divide-y divide-brand-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {metrics.map((m) => (
            <Metric key={m.label} config={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
````

<a id="src-components-dashboard-projectroadmap-tsx"></a>

## `src/components/dashboard/ProjectRoadmap.tsx`

````tsx
"use client";

import {
  UserPlus,
  ClipboardCheck,
  HeartHandshake,
  Activity,
  BarChart3,
  RefreshCw,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useOrgBranding } from "@/components/branding/OrgBrandingProvider";

type Status = "done" | "active" | "locked";

interface Step {
  title: string;
  desc: string;
  color: string;
  icon: LucideIcon;
  status: Status;
}

const STEPS: Step[] = [
  // Distinct cool ramp — teal → emerald → green for the done steps, a brighter
  // blue for the active step, navy/slate for locked. Varied per step but with NO
  // orange, yellow, or purple anywhere (DESIGN-SYSTEM.md §4).
  {
    title: "Onboarding",
    color: "#0EA5A4",
    icon: UserPlus,
    status: "done",
    desc: "Roster imported, employees invited and consent captured. Departments & seniority mapped.",
  },
  {
    title: "Baseline",
    color: "#10B981",
    icon: ClipboardCheck,
    status: "done",
    desc: "Q1 baseline battery completed — MHSF-III, Big-5 and the Common Core across all levels.",
  },
  {
    title: "Care Activated",
    color: "#22C55E",
    icon: HeartHandshake,
    status: "done",
    desc: "Therapy & coaching live. Organisation credits allocated; sessions hosted on Teams.",
  },
  {
    title: "Q2 Re-assess",
    color: "#1E3A5F", // brand navy — the "you are here" / active accent (matches nav + tabs)
    icon: Activity,
    status: "active",
    desc: "Current quarter — pulse + reassessment in progress. 76.5% participation so far.",
  },
  {
    title: "Q3 Review",
    color: "#94A3B8", // muted slate — locked / not yet started
    icon: BarChart3,
    status: "locked",
    desc: "Mid-year OWI trend, heatmaps and QBR report. Unlocks at the start of Q3.",
  },
  {
    title: "Renewal & Impact",
    color: "#94A3B8", // muted slate — locked / not yet started
    icon: RefreshCw,
    status: "locked",
    desc: "Annual ROI, outcome summary and program renewal. Locked until the cycle closes.",
  },
];

const CANVAS_W = 1320;
const CANVAS_H = 460;

const PANEL_TOP = 142;
const PANEL_START_X = 42;

const PANEL_W = 132;
const PANEL_H = 228;

const STEP_GAP = 190;

const CHEVRON_W = 48;
const CHEVRON_H = 76;

function getPanelLeft(index: number) {
  return PANEL_START_X + index * STEP_GAP;
}

function isPriorityHeading(title: string) {
  return (
    title === "Care Activated" ||
    title === "Q2 Re-assess" ||
    title === "Q3 Review"
  );
}

function HeaderDots() {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center"
      style={{ top: 24, gap: 7 }}
    >
      {STEPS.map((s) => (
        <span
          key={s.title}
          style={{
            width: 7,
            height: 7,
            borderRadius: 2,
            backgroundColor: s.color,
          }}
        />
      ))}
    </div>
  );
}

function StatusTag({ status, color }: { status: Status; color: string }) {
  const isDone = status === "done";
  const isActive = status === "active";

  const label = isDone ? "Done" : isActive ? "Live" : "Locked";

  return (
    <div
      aria-label={label}
      title={label}
      className="absolute flex items-center"
      style={{
        right: 8,
        top: 8,
        gap: 4,
        zIndex: 8,
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          backgroundColor: isDone ? color : "#FFFFFF",
          border: isDone
            ? `1px solid ${color}`
            : isActive
              ? `1.6px solid ${color}`
              : "1.6px solid #cbd5e1",
          boxShadow: isDone
            ? `0 4px 10px ${color}38`
            : "0 3px 8px rgba(15, 23, 42, 0.08)",
        }}
      >
        {isDone ? (
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1,
              transform: "translateY(-0.5px)",
            }}
          >
            ✓
          </span>
        ) : isActive ? (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: color,
            }}
          />
        ) : (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: "#cbd5e1",
            }}
          />
        )}
      </span>
    </div>
  );
}

function Chevron({
  index,
  color,
  muted = false,
}: {
  index: number;
  color: string;
  muted?: boolean;
}) {
  const left = getPanelLeft(index) + PANEL_W - 14;

  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left,
        top: PANEL_TOP + 66,
        width: CHEVRON_W,
        height: CHEVRON_H,
        zIndex: 8,
        pointerEvents: "none",
      }}
    >
      <span
        className="absolute"
        style={{
          left: -7,
          top: -56,
          width: 18,
          height: 188,
          background:
            "linear-gradient(90deg, rgba(25,33,45,0.12) 0%, rgba(25,33,45,0.035) 62%, transparent 100%)",
          filter: "blur(7px)",
          opacity: 0.24,
        }}
      />

      <span
        className="absolute"
        style={{
          left: -5,
          top: -56,
          width: 1,
          height: 188,
          background: "rgba(25, 33, 45, 0.06)",
        }}
      />

      <svg
        viewBox="0 0 48 76"
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <path
          d="
            M 0 0
            H 22
            C 26 0 28.5 1.8 30.5 5.2
            L 46 34
            C 48.5 38 48.5 38 46 42
            L 30.5 70.8
            C 28.5 74.2 26 76 22 76
            H 0
            L 20 38
            Z
          "
          fill={muted ? "#cbd5e1" : color}
          opacity={muted ? 0.82 : 1}
        />
      </svg>
    </div>
  );
}

function StepPanel({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  const left = getPanelLeft(index);
  const priorityHeading = isPriorityHeading(step.title);

  return (
    <div
      className="absolute"
      style={{
        left,
        top: PANEL_TOP,
        width: PANEL_W,
        height: PANEL_H,
        zIndex: 20,
      }}
    >
      <span
        aria-hidden
        className="absolute"
        style={{
          right: -22,
          top: 8,
          width: 22,
          height: PANEL_H - 16,
          background:
            "linear-gradient(270deg, transparent 0%, rgba(30,38,49,0.07) 42%, rgba(30,38,49,0.16) 100%)",
          filter: "blur(7px)",
          opacity: 0.48,
          zIndex: 0,
        }}
      />

      <div
        className="relative h-full w-full bg-white text-center"
        style={{
          padding: "24px 16px 0",
          zIndex: 2,
          boxShadow: "inset -1px 0 0 rgba(0,0,0,0.028)",
        }}
      >
        <StatusTag status={step.status} color={step.color} />

        <Icon
          style={{
            width: 38,
            height: 38,
            color: "#64748b",
            display: "block",
            margin: "0 auto",
          }}
          strokeWidth={1.45}
        />

        <h3
          className="uppercase"
          style={{
            margin: "16px auto 0",
            maxWidth: priorityHeading ? 124 : 116,
            color: step.color,
            fontSize: priorityHeading ? 11.3 : 9.8,
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: priorityHeading ? "0.1em" : "0.12em",
          }}
        >
          {step.title}
        </h3>

        <p
          style={{
            margin: "9px auto 0",
            maxWidth: 106,
            color: "#94a3b8",
            fontSize: 7.2,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: "0.025em",
          }}
        >
          {step.desc}
        </p>

        <div
          className="absolute tabular-nums"
          style={{
            right: 12,
            bottom: 12,
            color: "#64748b",
            fontSize: 44,
            fontWeight: 430,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
          }}
        >
          {index + 1}
        </div>
      </div>
    </div>
  );
}

export function ProjectRoadmap() {
  const branding = useOrgBranding();
  const done = STEPS.filter((s) => s.status === "done").length;

  return (
    <section className="w-full overflow-hidden bg-white">
      <div
        className="relative mx-auto bg-white"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <HeaderDots />

        <h2
          className="absolute left-0 right-0 text-center uppercase"
          style={{
            top: 64,
            color: "#334155",
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "0.075em",
          }}
        >
          Wellbeing Program Roadmap
        </h2>

        <p
          className="absolute left-0 right-0 text-center uppercase"
          style={{
            top: 106,
            color: "#94a3b8",
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: "0.45em",
          }}
        >
          {branding?.displayName ?? "ACME"} · {done}/{STEPS.length}{" "}
          achieved
        </p>

        {STEPS.map((step, index) => (
          <Chevron
            key={`${step.title}-chevron`}
            index={index}
            color={step.color}
            muted={index === STEPS.length - 1}
          />
        ))}

        {STEPS.map((step, index) => (
          <StepPanel key={step.title} step={step} index={index} />
        ))}

        <Trophy
          className="absolute"
          strokeWidth={1.45}
          style={{
            left: getPanelLeft(STEPS.length - 1) + PANEL_W + CHEVRON_W + 18,
            top: PANEL_TOP + 78,
            width: 48,
            height: 48,
            zIndex: 22,
            color: "#64748b",
          }}
        />
      </div>
    </section>
  );
}````

<a id="src-components-dashboard-freshnessstamp-tsx"></a>

## `src/components/dashboard/FreshnessStamp.tsx`

````tsx
import { Clock, AlertTriangle } from "lucide-react";
import type { Freshness } from "@/lib/graphql/types";

/**
 * "As-of / freshness" stamp on every payload (doc 12 P1-7) — so HR never reads
 * stale or empty numbers without a signal. Also surfaces the consent/contract
 * gate (`blocked_no_contract`, doc 13 P0-4) and the not-yet-computed state.
 */
export function FreshnessStamp({ freshness }: { freshness: Freshness }) {
  if (freshness.status === "blocked_no_contract") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-severity-amber">
        <AlertTriangle className="h-3.5 w-3.5" />
        Aggregation blocked — no active data-use basis for this client.
      </span>
    );
  }
  if (freshness.status === "not_yet_available" || !freshness.asOf) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
        <Clock className="h-3.5 w-3.5" />
        Not yet computed for this period.
      </span>
    );
  }
  const date = new Date(freshness.asOf);
  const label = Number.isNaN(date.getTime())
    ? freshness.asOf
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
      <Clock className="h-3.5 w-3.5" />
      As of {label}
      {freshness.status === "stale" && (
        <span className="ml-1 text-severity-amber">· stale</span>
      )}
    </span>
  );
}
````

<a id="src-components-dashboard-insightrail-tsx"></a>

## `src/components/dashboard/InsightRail.tsx`

````tsx
"use client";

import { Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardTitle, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useOrgInsights } from "@/lib/hooks/useDashboardData";
import type { InsightCard as InsightCardT } from "@/lib/graphql/types";

/**
 * Top-3 Insight Rail (doc 04 §2.3 Zone B). The Bridge's "what changed and what to
 * do" surface: ≤3 Finding → Play (→ Receipt) cards, ranked concerns-first by the
 * Privacy-Kernel RPC. Every card is a pure aggregate (an org-grain metric move) —
 * no individual data, k≥5 enforced server-side. Severity uses the calm ramp
 * (green/amber/coral) — never red on this gradient surface (doc 10 §2.1).
 */
export function InsightRail({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgInsights(period);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-muted" />
        <CardTitle>Top insights</CardTitle>
        <span className="text-xs text-brand-muted">— findings &amp; one thing to try</span>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-brand-muted">Insights are unavailable right now.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-brand-muted">
          No insights this quarter — nothing crossed a threshold or moved materially.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {data.map((card) => (
            <InsightCardView key={card.id} card={card} />
          ))}
        </div>
      )}
    </Card>
  );
}

function InsightCardView({ card }: { card: InsightCardT }) {
  const color = SEVERITY[card.severity];
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-brand-surface p-4 shadow-card">
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <p className="text-sm font-medium leading-snug text-brand-text">{card.finding}</p>
      </div>

      <div className="flex items-start gap-1.5 text-sm text-brand-muted">
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-brand-text">Try:</span> {card.play}
        </span>
      </div>

      {card.receipt ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: SEVERITY.green }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {card.receipt}
        </div>
      ) : (
        <div className="text-[11px] text-brand-muted">
          Receipt appears once a play is completed and re-measured.
        </div>
      )}
    </div>
  );
}
````

<a id="src-components-dashboard-owigauge-tsx"></a>

## `src/components/dashboard/OwiGauge.tsx`

````tsx
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Clock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SuppressedCell } from "@/components/dashboard/Privacy";
import { SEVERITY, owiBand } from "@/lib/severity";

/**
 * OWI headline gauge — a continuous score, so it uses the CALM gradient
 * (green→amber→coral, NEVER red). Half-donut 0–100.
 */
export function OwiGauge({
  value,
  suppressed = false,
  pendingNote,
}: {
  value: number | null;
  suppressed?: boolean;
  pendingNote?: string;
}) {
  const pending = !suppressed && value === null;
  const body = () => {
    if (!suppressed && value !== null) return <Gauge value={value} />;
    if (suppressed) return <div className="flex h-[150px] items-center"><SuppressedCell /></div>;
    return <PendingGauge />;
  };
  return (
    <Card className="flex h-full flex-col items-center gap-1">
      <CardTitle>Wellness Score (OWI)</CardTitle>
      {body()}
      {pending && (
        <span className="max-w-[200px] text-center text-[11px] leading-snug text-brand-muted">
          {pendingNote ?? "not yet available"}
        </span>
      )}
      <p className="mt-auto pt-1 text-xs text-brand-muted">
        Green ≥ 70 · Amber 55–69 · Coral &lt; 55
      </p>
    </Card>
  );
}

function PendingGauge() {
  return (
    <div className="relative h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[{ value: 100 }]}
            dataKey="value"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill="var(--brand-border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 flex flex-col items-center gap-1">
        <span className="text-3xl font-semibold leading-none text-slate-300">—</span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      </div>
    </div>
  );
}

function Gauge({ value }: { value: number }) {
  const color = SEVERITY[owiBand(value)];
  const data = [
    { name: "score", value },
    { name: "rest", value: 100 - value },
  ];
  return (
    <div className="relative h-[150px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="100%"
            startAngle={180}
            endAngle={0}
            innerRadius={70}
            outerRadius={100}
            stroke="none"
            isAnimationActive={false}
          >
            <Cell fill={color} />
            <Cell fill="var(--brand-border)" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
        <span className="text-3xl font-semibold tabular-nums" style={{ color }}>
          {value}
        </span>
        <span className="text-sm text-brand-muted">/100</span>
      </div>
    </div>
  );
}
````

<a id="src-components-dashboard-kpicard-tsx"></a>

## `src/components/dashboard/KpiCard.tsx`

````tsx
import type { ReactNode } from "react";
import { TrendingUp, TrendingDown, Clock, Lock } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";

export function KpiCard({
  title,
  value,
  unit,
  delta,
  suppressed = false,
  pendingNote,
  alert = false,
  footer,
}: {
  title: string;
  value: number | null;
  unit?: string;
  delta?: number | null;
  suppressed?: boolean;
  pendingNote?: string;
  alert?: boolean;
  footer?: ReactNode;
}) {
  const body = () => {
    if (suppressed || (value === null && !pendingNote)) return <Placeholder kind="suppressed" />;
    if (value === null) return <Placeholder kind="pending" note={pendingNote} />;
    return (
      <div className="flex items-baseline gap-1">
        <span
          className="text-4xl font-semibold tabular-nums"
          style={alert ? { color: "var(--severity-red)" } : undefined}
        >
          {value}
        </span>
        {unit && <span className="text-lg text-brand-muted">{unit}</span>}
      </div>
    );
  };

  return (
    <Card className="flex h-full flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      <div className="flex flex-1 flex-col justify-center">{body()}</div>
      {typeof delta === "number" && (
        <div
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: delta >= 0 ? "var(--severity-green)" : "var(--severity-coral)" }}
        >
          {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
          {delta >= 0 ? "+" : ""}
          {delta} pts vs prior quarter
        </div>
      )}
      {footer && <div className="text-xs text-brand-muted">{footer}</div>}
    </Card>
  );
}

function Placeholder({ kind, note }: { kind: "pending" | "suppressed"; note?: string }) {
  const pending = kind === "pending";
  const Icon = pending ? Clock : Lock;
  return (
    <div className="flex flex-col items-center gap-2 py-2 text-center">
      <span className="text-4xl font-semibold leading-none text-slate-300">—</span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-500">
        <Icon className="h-3 w-3" />
        {pending ? "Pending" : "Below threshold"}
      </span>
      <span className="max-w-[190px] text-[11px] leading-snug text-brand-muted">
        {pending ? note : "Cohort under 5 — suppressed for anonymity"}
      </span>
    </div>
  );
}
````

<a id="src-components-dashboard-overviewwidgets-tsx"></a>

## `src/components/dashboard/OverviewWidgets.tsx`

````tsx
"use client";

import type { ComponentType } from "react";
import { BarChart3, Layers, Trophy, ShieldAlert, Users } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SuppressedCell } from "@/components/dashboard/Privacy";
import { SEVERITY, owiBand, stressBucketColor } from "@/lib/severity";
import type {
  SegmentationSlice,
  ByLevelOwi,
  CoverageTile,
  TeamExtreme,
} from "@/lib/graphql/types";

function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-border py-8 text-center">
      <Icon className="h-7 w-7 text-brand-muted opacity-40" />
      <p className="text-sm font-medium text-brand-text">{title}</p>
      <p className="max-w-sm text-xs text-brand-muted">{hint}</p>
      {children}
    </div>
  );
}

export function SegmentationBar({ data }: { data: SegmentationSlice[] }) {
  const visible = data.filter((s) => !s.suppressed && s.pct !== null);
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Employee Segmentation (perceived stress)</CardTitle>
      {visible.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Stress segmentation not available yet"
          hint="This unlocks once PSS-10 is part of the campaign battery and at least 5 people respond."
        >
          <div className="mt-2 flex h-7 w-48 overflow-hidden rounded-md opacity-30">
            <div className="h-full w-1/2" style={{ backgroundColor: SEVERITY.green }} />
            <div className="h-full w-1/3" style={{ backgroundColor: SEVERITY.amber }} />
            <div className="h-full w-1/6" style={{ backgroundColor: SEVERITY.coral }} />
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="flex h-7 w-full overflow-hidden rounded-md">
            {visible.map((s) => (
              <div
                key={s.label}
                className="h-full"
                style={{ width: `${s.pct}%`, backgroundColor: stressBucketColor(s.label) }}
                title={`${s.label}: ${s.pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {data.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stressBucketColor(s.label) }} />
                <span className="text-brand-muted">{s.label}</span>
                <span className="font-medium tabular-nums">
                  {s.suppressed || s.pct === null ? "—" : `${s.pct}%`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function ByLevelBars({ data }: { data: ByLevelOwi[] }) {
  const hasData = data.some((r) => !r.suppressed && r.owi !== null);
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Wellness Score by Level</CardTitle>
      {data.length === 0 || !hasData ? (
        <EmptyState
          icon={Layers}
          title="Wellness by level is pending"
          hint="Per-level wellbeing unlocks once the OWI weighting is clinically signed off. Cohorts under 5 stay suppressed."
        >
          <div className="mt-2 flex w-64 flex-col gap-2">
            {["L1", "L2", "L3"].map((lvl, i) => (
              <div key={lvl} className="flex items-center gap-2">
                <span className="w-6 text-xs text-brand-muted">{lvl}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-bg">
                  <div className="h-full rounded-full bg-slate-200" style={{ width: `${[62, 48, 40][i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((row) => (
            <div key={row.level} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-brand-muted">{row.level}</span>
              {row.suppressed || row.owi === null ? (
                <div className="flex-1"><SuppressedCell /></div>
              ) : (
                <>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-bg">
                    <div className="h-full rounded-full" style={{ width: `${row.owi}%`, backgroundColor: SEVERITY[owiBand(row.owi)] }} />
                  </div>
                  <span className="w-10 text-right text-sm font-medium tabular-nums">{row.owi}</span>
                </>
              )}
              <span className="w-16 text-right text-xs text-brand-muted">n={row.n}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CoverageTiles({ data }: { data: CoverageTile[] }) {
  const participation = data.find((t) => /participation/i.test(t.instrument));
  const pct = participation && !participation.suppressed ? participation.completedPct : null;
  const others = data.filter((t) => t !== participation);
  const TARGET = 70;

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>Assessment Coverage</CardTitle>

      {pct !== null && pct !== undefined ? (
        <div className="rounded-xl bg-brand-bg p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-brand-muted">Participation</div>
              <div className="mt-0.5 text-3xl font-semibold tabular-nums text-brand-text">{pct}%</div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: pct >= TARGET ? SEVERITY.green : SEVERITY.amber }}
            >
              <Users className="h-4 w-4" />
              {pct >= TARGET ? "at / above target" : `below ${TARGET}% target`}
            </div>
          </div>
          <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-bg">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: pct >= TARGET ? SEVERITY.green : "var(--brand-primary)" }}
            />
            <div className="absolute top-0 h-full border-l-2 border-brand-text/40" style={{ left: `${TARGET}%` }} title={`${TARGET}% target`} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-brand-muted">
            <span>0%</span>
            <span>target {TARGET}%</span>
            <span>100%</span>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="Coverage not available yet" hint="Participation appears once a campaign closes and a snapshot is frozen." />
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {others.map((t) => (
            <div key={t.instrument} className="rounded-lg bg-brand-bg p-3 text-center">
              <div className="text-xs text-brand-muted">{t.instrument}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {t.suppressed || t.completedPct === null ? <SuppressedCell /> : `${t.completedPct}%`}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Drill into the named Participation Tracker for who has / hasn&apos;t completed (status only).
      </p>
    </Card>
  );
}

export function TeamExtremes({
  mostVulnerable,
  happiest,
}: {
  mostVulnerable: TeamExtreme | null;
  happiest: TeamExtreme | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TeamCard title="Most Vulnerable Team" icon={ShieldAlert} team={mostVulnerable} />
      <TeamCard title="Happiest Team" icon={Trophy} team={happiest} />
    </div>
  );
}

function TeamCard({
  title,
  icon: Icon,
  team,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  team: TeamExtreme | null;
}) {
  const empty = !team || team.suppressed || team.owi === null;
  return (
    <Card className="flex flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      {empty ? (
        <EmptyState
          icon={Icon}
          title="No team meets the threshold yet"
          hint="A team appears here once 5+ of its members respond — protecting anonymity."
        />
      ) : (
        <>
          <div className="text-base font-medium text-brand-text">{team!.team}</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums" style={{ color: SEVERITY[owiBand(team!.owi as number)] }}>
              {team!.owi}
            </span>
            <span className="text-xs text-brand-muted">OWI · n={team!.n}</span>
          </div>
        </>
      )}
    </Card>
  );
}
````

<a id="src-components-dashboard-engagedcoveredlivescard-tsx"></a>

## `src/components/dashboard/EngagedCoveredLivesCard.tsx`

````tsx
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
````

<a id="src-components-dashboard-motionquadrant-tsx"></a>

## `src/components/dashboard/MotionQuadrant.tsx`

````tsx
"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { Compass } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useOrgQuadrant } from "@/lib/hooks/useDashboardData";
import type { QuadrantPoint } from "@/lib/graphql/types";

/**
 * Stress × Engagement motion quadrant (doc 04 §2.3 Zone D). One point per cohort:
 * x = Stress (PSS-high%, higher = worse), y = Engagement (UWES, higher = better).
 * The four quadrants are Thriving / Coasting / Straining / Burning. Aggregate-only,
 * k≥5 — a cohort plots only when BOTH axes are known (the RPC drops half-known and
 * sub-k points). Today the source cells (PSS-high% + UWES) aren't computed yet, so
 * this renders its honest "building" state rather than a fabricated cloud.
 *
 * Calm ramp only (no red): point colour reflects the quadrant's severity.
 */

// Quadrant of a point: stress is x (↑=worse), engagement is y (↑=better).
function pointColor(p: QuadrantPoint): string {
  const stressed = (p.stress ?? 0) >= 50;
  const engaged = (p.engagement ?? 0) >= 50;
  if (!stressed && engaged) return SEVERITY.green; // Thriving
  if (stressed && engaged) return SEVERITY.amber; // Straining (engaged but stressed)
  if (!stressed && !engaged) return SEVERITY.amber; // Coasting (calm but disengaged)
  return SEVERITY.coral; // Burning (stressed + disengaged)
}

function QuadrantLabel({ x, y, text }: { x: string; y: string; text: string }) {
  return (
    <div
      className="pointer-events-none absolute text-[10px] font-medium uppercase tracking-wide text-brand-muted/70"
      style={{ [x]: 8, [y]: 8 } as React.CSSProperties}
    >
      {text}
    </div>
  );
}

export function MotionQuadrant({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgQuadrant(period, "DEPARTMENT");
  const points = data ?? [];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Compass className="h-4 w-4 text-brand-muted" />
        <CardTitle>Stress × Engagement</CardTitle>
        <span className="text-xs text-brand-muted">— by department, k≥5</span>
      </div>

      {isLoading ? (
        <div className="h-[320px] w-full animate-pulse rounded-xl bg-brand-border/40" />
      ) : isError ? (
        <p className="text-sm text-brand-muted">The quadrant is unavailable right now.</p>
      ) : points.length === 0 ? (
        <BuildingState />
      ) : (
        <div className="relative">
          <QuadrantLabel x="left" y="top" text="Burning" />
          <QuadrantLabel x="right" y="top" text="Straining" />
          <QuadrantLabel x="left" y="bottom" text="Coasting" />
          <QuadrantLabel x="right" y="bottom" text="Thriving" />
          <ResponsiveContainer width="100%" height={320}>
            <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 8 }}>
              <XAxis
                type="number"
                dataKey="stress"
                name="Stress"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                label={{ value: "Stress →", position: "bottom", fontSize: 11, fill: "var(--brand-muted)" }}
              />
              <YAxis
                type="number"
                dataKey="engagement"
                name="Engagement"
                domain={[0, 100]}
                tickCount={6}
                tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                label={{ value: "Engagement →", angle: -90, position: "left", fontSize: 11, fill: "var(--brand-muted)" }}
              />
              <ZAxis type="number" dataKey="n" range={[80, 360]} name="cohort size" />
              <ReferenceLine x={50} stroke="var(--brand-border)" strokeDasharray="4 4" />
              <ReferenceLine y={50} stroke="var(--brand-border)" strokeDasharray="4 4" />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--brand-border)" }}
                formatter={(value: number, name: string) => [`${value}`, name]}
                labelFormatter={() => ""}
              />
              <Scatter data={points} isAnimationActive={false}>
                {points.map((p) => (
                  <Cell key={p.grainRef ?? p.label} fill={pointColor(p)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function BuildingState() {
  return (
    <div className="flex h-[320px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-brand-border bg-brand-bg/30 px-6 text-center">
      <Compass className="h-6 w-6 text-brand-muted" />
      <p className="max-w-sm text-sm font-medium text-brand-text">
        Building your Stress × Engagement map
      </p>
      <p className="max-w-md text-xs leading-relaxed text-brand-muted">
        Each department will plot here once two inputs are live at k≥5: perceived
        stress (PSS-10 high-stress share) and work engagement (UWES). A cohort
        appears only when both are known — we never guess a position.
      </p>
    </div>
  );
}
````

<a id="src-components-dashboard-trendchart-tsx"></a>

## `src/components/dashboard/TrendChart.tsx`

````tsx
"use client";

import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { useMetricTrend } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import type { MetricKey, TrendPoint } from "@/lib/graphql/types";

/**
 * Quarter-over-quarter trend (doc 04 / doc 10 §4). Org-grain, k≥5; suppressed
 * points are gaps (null), never reconstructed. Inactive metrics (e.g. OWI pending
 * sign-off) return no series. Calm palette — never red on a gradient line.
 */
const SERIES: { key: MetricKey; label: string; color: string }[] = [
  { key: "PARTICIPATION_PCT", label: "Participation", color: "var(--brand-primary)" },
  { key: "RESPONSE_VALIDITY_RATE", label: "Validity", color: SEVERITY.amber },
  { key: "TRUST_QUOTIENT", label: "Trust", color: SEVERITY.green },
];

export function TrendChart() {
  const part = useMetricTrend("PARTICIPATION_PCT");
  const valid = useMetricTrend("RESPONSE_VALIDITY_RATE");
  const trust = useMetricTrend("TRUST_QUOTIENT");

  if (part.isLoading || valid.isLoading || trust.isLoading)
    return <Skeleton className="h-64 w-full rounded-xl" />;
  if (part.isError || valid.isError || trust.isError) return <CardError className="h-64" />;

  // merge the three series by period
  const periods = Array.from(
    new Set(
      [part.data, valid.data, trust.data]
        .flatMap((s) => (s ?? []).map((p) => p.period)),
    ),
  ).sort();
  const idx = (s: TrendPoint[] | undefined) => new Map((s ?? []).map((p) => [p.period, p.value]));
  const mp = idx(part.data), mv = idx(valid.data), mt = idx(trust.data);
  const rows = periods.map((period) => ({
    period,
    PARTICIPATION_PCT: mp.get(period) ?? null,
    RESPONSE_VALIDITY_RATE: mv.get(period) ?? null,
    TRUST_QUOTIENT: mt.get(period) ?? null,
  }));

  if (rows.length < 2) {
    return (
      <Card>
        <CardTitle>Trends</CardTitle>
        <p className="mt-2 text-sm text-brand-muted">
          Need at least two published quarters to show a trend. One snapshot so far.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <CardTitle>Quarter-over-quarter trends</CardTitle>
        <span className="text-xs text-brand-muted">org-grain · k≥5 · suppressed points are gaps</span>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 8, right: 12, bottom: 4, left: -12 }}>
            <CartesianGrid stroke="rgba(0,0,0,0.05)" vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 12, fill: "var(--brand-muted)" }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "var(--brand-muted)" }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2}
                dot={{ r: 3 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
````

<a id="src-components-layout-appshell-tsx"></a>

## `src/components/layout/AppShell.tsx`

````tsx
"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// Phosphor Icons — a deliberately non-default icon pack (lucide is the shadcn/AI
// default; Phosphor's duotone/fill weights give the rail a distinctive,
// hand-designed feel). See DESIGN-SYSTEM.md §1.
import {
  SignOut,
  UsersThree,
  ShieldCheck,
  BookOpen,
  UserPlus,
  Receipt,
  SquaresFour,
  Heartbeat,
  User,
  Pulse,
  HandHeart,
  ChartLineUp,
  Checks,
  Lightning,
  Scroll,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useOrgBranding } from "@/components/branding/OrgBrandingProvider";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { TopbarFilters } from "@/components/dashboard/TopbarFilters";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LOGIN_PAGE } from "@/lib/auth/mfa";

// The dashboard's seven sections — now the top group of the rail (replacing the
// in-body horizontal tab bar). Each links to /dashboard?tab=<id>; active state is
// derived from the `tab` query param in <RailTabs>.
const DASH_TABS: { tab: string; label: string; icon: PhosphorIcon }[] = [
  { tab: "overview", label: "Overview", icon: SquaresFour },
  { tab: "health", label: "Health & Risk", icon: Pulse },
  { tab: "engagement", label: "Engagement", icon: HandHeart },
  { tab: "impact", label: "Impact", icon: ChartLineUp },
  { tab: "verify", label: "Verify", icon: Checks },
  { tab: "act", label: "Act & Programmes", icon: Lightning },
  { tab: "govern", label: "Reports & Govern", icon: Scroll },
];

// The other top-level surfaces — the rail's bottom group (below a divider).
const SURFACES: { href: string; label: string; icon: PhosphorIcon }[] = [
  { href: "/report", label: "Health Report", icon: Heartbeat },
  { href: "/participation", label: "Participation", icon: UsersThree },
  { href: "/onboarding", label: "Onboarding", icon: UserPlus },
  { href: "/guide", label: "How it works", icon: BookOpen },
  { href: "/evidence", label: "Evidence", icon: Receipt },
];

// Phone bottom-bar nav: a single Dashboard entry + the surfaces (the seven tabs
// stay as the in-body TabNav on phones, where the rail is hidden).
const MOBILE_NAV: { href: string; label: string; icon: PhosphorIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  ...SURFACES,
];

const NAVY = "#1E3A5F";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * RailTooltip — the styled hover/focus label for an icon-rail item, replacing the
 * native browser `title` tooltip. A dark pill that fades + slides in to the right
 * of the icon on hover and on keyboard focus-visible. The parent must be
 * `group relative`; the pill is pointer-events-none so it never blocks the click.
 */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-md bg-brand-text px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

/** A single icon item in the rail: active fill + tooltip, shared by tabs & surfaces. */
function RailLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: PhosphorIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        active ? "bg-white/15 text-white" : "text-white/60 hover:bg-white/10 hover:text-white",
      )}
    >
      <Icon weight={active ? "fill" : "duotone"} className="h-5 w-5" />
      <RailTooltip label={label} />
    </Link>
  );
}

/** The seven dashboard tabs in the rail. Reads the `tab` query param for the active
 *  state, so it must be rendered inside a <Suspense> boundary. */
function RailTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const onDash = pathname === "/dashboard";
  const currentTab = params.get("tab") ?? "overview";
  return (
    <>
      {DASH_TABS.map(({ tab, label, icon }) => (
        <RailLink
          key={tab}
          href={`/dashboard?tab=${tab}`}
          label={label}
          icon={icon}
          active={onDash && currentTab === tab}
        />
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const branding = useOrgBranding();

  // The dashboard filters live in the app bar on wide screens; the body keeps a
  // fallback FilterBar below `xl` (DashboardView). Filters are dashboard-only.
  const showFilters = pathname === "/dashboard";

  async function signOut() {
    await supabase.auth.signOut();
    router.replace(LOGIN_PAGE);
  }

  const logoSrc = branding?.logoUrl ?? "/images/moodscale_logo1.png";
  const logoAlt = branding?.displayName ?? "MoodScale";

  return (
    <div className="min-h-screen">
      {/* ── Left icon rail — dark navy, icon-only, fixed full-height. Hidden on
          phones (nav moves to the bottom bar). Tablet 56px, desktop 64px. ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center py-3 md:flex lg:w-16"
        style={{ backgroundColor: NAVY }}
      >
        {/* Brand mark in a white tile so the dark logo reads on the navy rail. */}
        <Link
          href="/"
          className="group relative mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:h-10 lg:w-10"
          aria-label={logoAlt}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={32}
            height={32}
            className="h-6 w-6 object-contain lg:h-7 lg:w-7"
            priority
          />
          <RailTooltip label="Home" />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Dashboard sections (the seven tabs). Suspense because RailTabs reads
              the `tab` query param via useSearchParams. */}
          <Suspense fallback={null}>
            <RailTabs />
          </Suspense>

          {/* Divider between the dashboard tabs and the other surfaces. */}
          <div className="my-1.5 h-px w-6 shrink-0 bg-white/15" />

          {SURFACES.map(({ href, label, icon }) => (
            <RailLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(pathname, href)}
            />
          ))}
        </nav>

        <button
          onClick={signOut}
          aria-label="Sign out"
          className="group relative flex h-10 w-10 items-center justify-center rounded-xl text-white/60 transition-colors duration-150 hover:bg-white/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <SignOut weight="duotone" className="h-5 w-5" />
          <RailTooltip label="Sign out" />
        </button>
      </aside>

      {/* ── Main column — offset by the rail width on md+; full width on phones. ── */}
      <div className="md:pl-14 lg:pl-16">
        {/* Topbar — dark navy, pinned with position:fixed (NOT sticky, which can
            drift / leave a growing gap on some pages). Offset from the left by the
            rail width on md+; full width on phones. z-40 keeps it above all page
            content (some widgets use inline z-indices up to ~22). The matching
            top padding lives on <main> below so content never hides under it. */}
        <header
          className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 px-4 sm:px-6 md:left-14 lg:left-16 lg:px-8"
          style={{ backgroundColor: NAVY }}
        >
          {/* Phone-only brand mark (the rail is hidden there). */}
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm md:hidden"
            aria-label={logoAlt}
          >
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={28}
              height={28}
              className="h-5 w-5 object-contain"
              priority
            />
          </Link>

          {/* The page H1 lives in the body (each page renders its own). The topbar
              stays light: just the white-label org name as context when present. */}
          {branding?.displayName && (
            <div className="hidden min-w-0 sm:block">
              <span className="truncate text-sm font-medium text-white/80">
                {branding.displayName}
              </span>
            </div>
          )}

          {/* Workspace lens selector (Organisation ⇄ My Teams), entitlement-aware. */}
          <div className="hidden sm:block">
            <WorkspaceSwitcher />
          </div>

          {/* Dashboard filters — in the app bar on wide screens (xl+); the body
              FilterBar is the fallback below xl. Suspense because it reads
              useSearchParams. */}
          {showFilters && (
            <Suspense fallback={null}>
              <div className="hidden xl:flex">
                <TopbarFilters defaultPeriod="2026-Q2" />
              </div>
            </Suspense>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* MFA status — just the shield; reveals "MFA verified" on hover. */}
            <span
              className="group relative hidden cursor-default sm:inline-flex"
              aria-label="MFA verified"
            >
              <ShieldCheck weight="fill" className="h-[18px] w-[18px] text-severity-green" />
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-brand-text px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
              >
                MFA verified
              </span>
            </span>
            {/* Sign out lives in the rail on md+; keep an icon here for phones. */}
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white md:hidden"
            >
              <SignOut weight="duotone" className="h-4 w-4" />
            </button>
            {/* Account avatar (parity with the reference shells). */}
            <span
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white"
              title={logoAlt}
              aria-hidden
            >
              <User weight="duotone" className="h-4 w-4" />
            </span>
          </div>
        </header>

        {/* Content — fluid gutters, capped only on ultra-wide. pt-20 clears the
            fixed h-14 topbar (56px) + breathing room; pb-24 on phones clears the
            fixed bottom tab bar. */}
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-20 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>

        {/* Watermark footer — the privacy invariant, always on screen. */}
        <footer className="mx-auto w-full max-w-[1600px] px-4 pb-24 text-center text-xs text-brand-muted sm:px-6 md:pb-6 lg:px-8">
          Employer view · aggregates (k≥5) and participation status only · never
          individual responses, scores, or risk.
        </footer>
      </div>

      {/* ── Phone bottom tab bar — replaces the rail under md. Fixed, dark navy,
          icon + tiny label, respects the iOS home-indicator safe area. ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around md:hidden"
        style={{
          backgroundColor: NAVY,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Primary"
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors duration-150",
                active ? "text-white" : "text-white/55 hover:text-white",
              )}
            >
              <Icon weight={active ? "fill" : "duotone"} className="h-5 w-5" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
````

<a id="src-components-ui-primitives-tsx"></a>

## `src/components/ui/primitives.tsx`

````tsx
import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        // Borderless card (DESIGN-SYSTEM.md §3): NO border, NO accent bar, NO blur.
        // Depth comes from a soft two-layer shadow on the white surface over the
        // slate canvas; it lifts a touch on hover. This is the elevation contract
        // every box inherits.
        "rounded-xl bg-brand-surface p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-sm font-medium text-brand-muted tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * CardHeading — a prominent card header: an optional icon in a soft tile, a BOLD
 * title, and an optional right-aligned action (badge/button). Use for content
 * cards that deserve a strong heading (vs the muted label-style CardTitle).
 */
export function CardHeading({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand-muted">
            {icon}
          </span>
        )}
        <h3 className="truncate text-base font-bold tracking-tight text-brand-text">{title}</h3>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  // B2C button: rounded-lg, navy primary (#1E3A5F) with shadow depth, navy focus
  // ring, smooth all-property transition. Matches B2C §7.
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2";
  const variants = {
    primary: "bg-[#1E3A5F] text-white shadow-sm hover:bg-[#162d4a] hover:shadow-md",
    outline:
      "border border-brand-border bg-brand-surface text-brand-text shadow-sm hover:bg-brand-bg",
    ghost: "text-brand-text hover:bg-brand-bg",
  } as const;
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string; // a CSS color value (e.g. var(--severity-coral))
  className?: string;
}) {
  return (
    <span
      className={cn(
        // B2C badge: pill, text-xs font-semibold (B2C §8). The severity color-mix
        // tinting below is preserved — only the brand/typography is aligned.
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      style={
        color
          ? { backgroundColor: `color-mix(in srgb, ${color} 16%, white)`, color }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/**
 * StatusDot — the borderless replacement for the old `border-l-4` accent bar
 * (DESIGN-SYSTEM.md §3/§6). A small filled dot in a severity/brand tone, with an
 * optional label, used to signal a card's state (alert / celebration / clean)
 * without ever drawing a colored bar or border on the box. A subtle ring softens
 * the dot so it reads as a calm indicator, not a warning light.
 */
export function StatusDot({
  color,
  label,
  className,
}: {
  color: string; // a CSS color value (e.g. var(--severity-green))
  label?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)` }}
      />
      {label != null && (
        <span className="text-xs font-medium text-brand-muted">{label}</span>
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-brand-border/60", className)} />
  );
}

/**
 * CardError — the load-FAILURE state for a card. Deliberately distinct from the
 * muted k-anonymity "below threshold" suppression and the "pending" placeholders,
 * so a failed query can never masquerade as legitimate privacy-suppression or
 * honest-pending. Use when a card's query returns isError.
 */
export function CardError({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-xl border border-severity-red/30 bg-severity-red/10 p-4 text-center text-sm text-severity-red",
        className,
      )}
    >
      Could not load this card — refresh to retry.
    </div>
  );
}
````

<a id="src-components-ui-dropdown-tsx"></a>

## `src/components/ui/Dropdown.tsx`

````tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropdown({
  value,
  options,
  onChange,
  minWidth = 160,
  tone = "light",
  size = "md",
  openOnHover = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  minWidth?: number;
  // "light" = default control on a light surface; "dark" = translucent control
  // for the dark navy app bar, with a navy (bar-coloured) menu.
  tone?: "light" | "dark";
  // "md" = default; "sm" = compact (e.g. the app-bar filters).
  size?: "md" | "sm";
  // Open the menu on hover (in addition to click). Used by the app-bar filters
  // on desktop; a short close-delay keeps it open across the trigger→menu gap.
  openOnHover?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // `render` keeps the menu mounted through its exit animation; `show` drives the
  // enter/leave transition (fade + slight slide/scale).
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Clean up any pending close timer on unmount.
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Mount → next frame → enter; on close, play the leave transition, then unmount.
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const current = options.find((o) => o.value === value);
  const dark = tone === "dark";
  const sm = size === "sm";

  return (
    <div
      ref={ref}
      className="relative"
      style={{ minWidth }}
      onMouseEnter={openOnHover ? () => { cancelClose(); setOpen(true); } : undefined}
      onMouseLeave={openOnHover ? scheduleClose : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2",
          sm ? "h-8 gap-1.5 px-2.5 text-xs" : "h-9 gap-2 px-3 text-sm",
          dark
            ? // Borderless soft pill on the dark app bar — fill only, no outline.
              "bg-white/10 text-white hover:bg-white/[0.18] focus-visible:ring-white/40"
            : "border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-bg focus-visible:ring-[#1E3A5F]",
        )}
      >
        <span className="truncate">{current?.label ?? "Select"}</span>
        <ChevronDown
          className={cn(
            "shrink-0 transition-transform duration-300 ease-out",
            sm ? "h-3.5 w-3.5" : "h-4 w-4",
            dark ? "opacity-70" : "opacity-50",
            open && "rotate-180",
          )}
        />
      </button>
      {render && (
        <div
          className={cn(
            "absolute z-50 mt-1 max-h-64 min-w-full origin-top overflow-auto rounded-lg py-1 shadow-lg transition-all duration-200 ease-out",
            show ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
            dark
              ? // Menu backdrop matches the app bar (navy), with a hairline ring
                // for separation from the page content it floats over.
                "bg-[#1E3A5F] text-white ring-1 ring-white/10"
              : "border border-brand-border bg-brand-surface",
          )}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full whitespace-nowrap px-3 py-1.5 text-left transition-colors",
                sm ? "text-xs" : "text-sm",
                dark ? "text-white/90 hover:bg-white/10" : "text-brand-text hover:bg-brand-bg",
                o.value === value && (dark ? "bg-white/10 font-medium" : "font-medium"),
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
````

<a id="src-lib-severity-ts"></a>

## `src/lib/severity.ts`

````ts
/**
 * Severity colour system — doc 10 §2.1 (LOCKED rule).
 *
 *  • CONTINUOUS gradient (OWI ramp, heatmap, distribution): green → amber → CORAL.
 *    NEVER red. Coral is the calm "serious, act now" top-of-ramp — it says
 *    severity without the stigma of red.
 *  • DISCRETE employer/HR alert (a KPI crossing a cutpoint): red is allowed,
 *    because HR reads it like a finance dashboard and it is aggregate data, not a
 *    person. Use `discreteAlert()` for these and ONLY these.
 *
 * This is an employer surface, so discrete red is permitted. It must never leak
 * onto a gradient. There is no employee-facing surface in this app.
 */

export const SEVERITY = {
  green: "var(--severity-green)",
  amber: "var(--severity-amber)",
  coral: "var(--severity-coral)",
  red: "var(--severity-red)",
  suppressed: "var(--severity-suppressed)",
} as const;

export type GradientBand = "green" | "amber" | "coral";

/**
 * Map a 0–100 score to a calm gradient band. `higherIsBetter` flips direction
 * (e.g. OWI/WHO-5 higher=better; PSS/OBI higher=worse).
 * Returns ONLY green/amber/coral — never red (rule: no red on a gradient).
 */
export function gradientBand(
  score: number,
  higherIsBetter: boolean,
): GradientBand {
  const good = higherIsBetter ? score >= 70 : score < 35;
  const mid = higherIsBetter
    ? score >= 55 && score < 70
    : score >= 35 && score < 68;
  if (good) return "green";
  if (mid) return "amber";
  return "coral";
}

export function gradientColor(score: number, higherIsBetter: boolean): string {
  return SEVERITY[gradientBand(score, higherIsBetter)];
}

/** OWI headline bands (doc 10 §2): Green ≥70 / Amber 55–69 / Coral <55. */
export function owiBand(owi: number): GradientBand {
  if (owi >= 70) return "green";
  if (owi >= 55) return "amber";
  return "coral";
}

/**
 * Discrete employer KPI alert. `breached` true → red (#E84D3D). This is the
 * ONLY sanctioned use of red in the app. Example: % High Stress > 20%.
 */
export function discreteAlert(breached: boolean): string {
  return breached ? SEVERITY.red : "var(--brand-text)";
}

/** PSS stress segmentation buckets (doc 10 §2): <35 / 35–67 / ≥68. */
export function stressBucketColor(
  bucket: "Stress-Free" | "Borderline" | "High Stress",
): string {
  switch (bucket) {
    case "Stress-Free":
      return SEVERITY.green;
    case "Borderline":
      return SEVERITY.amber;
    case "High Stress":
      return SEVERITY.coral;
  }
}
````

<a id="src-lib-utils-ts"></a>

## `src/lib/utils.ts`

````ts
import { twMerge } from "tailwind-merge";
import clsx, { type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** A safe redirect path: only same-origin absolute paths ("/x"), never "//x". */
export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  return value;
}
````

<a id="src-app-globals-css"></a>

## `src/app/globals.css`

````css
@import "tailwindcss";

/*
 * Design tokens — doc 10 §2.1. TWO DISTINCT PALETTES, never mixed:
 *  (a) brand/chrome  — theme the shell; per-org overridable via org_branding.
 *  (b) data-severity — FIXED, brand-independent. An org's brand colour must
 *      never recolour a severity band.
 *
 * SEVERITY-COLOUR RULE (LOCKED, doc 10 §2.1):
 *  - continuous gradients (OWI ramp, heatmaps, distributions): green→amber→CORAL,
 *    NEVER red.
 *  - red (#E84D3D) ONLY on discrete employer/HR threshold alerts (KPI crossing a
 *    cutpoint), never on a gradient, never on any employee-facing surface.
 */
:root {
  /* (a) brand / chrome — B2C navy accent + slate neutrals, applied globally.
   * Aligned to the B2C design system (#1E3A5F navy + Tailwind slate scale) so the
   * shell, cards, and typography read identically across the B2C and B2B apps. */
  --brand-primary: #1e3a5f; /* active tab/nav, primary buttons, focus — B2C navy */
  --brand-primary-hover: #162d4a;
  --brand-accent: #1e3a5f;
  --brand-lockup: #e84d3d; /* MoodScale brand red — logo/title lockup ONLY (identity, not data) */
  --brand-bg: #f8fafc; /* B2C light base (slate-50) — gradient layered on top of this */
  --brand-surface: #ffffff;
  --brand-text: #0f172a; /* slate-900 */
  --brand-muted: #475569; /* slate-600 */
  --brand-border: #e2e8f0; /* slate-200 */

  /* (b) data-semantic / severity — fixed, do NOT theme per org */
  --severity-green: #22c55e; /* healthy / positive */
  --severity-amber: #f59e0b; /* borderline / caution */
  --severity-coral: #f08e80; /* serious — calm ramp top, NOT red */
  --severity-red: #e84d3d; /* discrete employer alert ONLY */
  --severity-suppressed: #f1f5f9; /* neutral slate — "below reporting threshold" */
  --severity-suppressed-text: #64748b;

  /* (c) elevation — boxes are defined by SHADOW, never a border or accent bar
   * (DESIGN-SYSTEM.md §3). Two-layer soft shadow lifts white cards off the slate
   * canvas as "raised paper"; the hover variant adds a touch more depth. */
  --elevation-card: 0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 24px -12px rgba(16, 24, 40, 0.1);
  --elevation-card-hover: 0 1px 2px rgba(16, 24, 40, 0.05), 0 12px 28px -10px rgba(16, 24, 40, 0.14);
}

@theme inline {
  /* Inter as the default sans (B2C parity). Falls back to system fonts before load. */
  --font-sans: var(--font-inter), ui-sans-serif, system-ui, sans-serif;

  --color-brand-primary: var(--brand-primary);
  --color-brand-accent: var(--brand-accent);
  --color-brand-lockup: var(--brand-lockup);
  --color-brand-bg: var(--brand-bg);
  --color-brand-surface: var(--brand-surface);
  --color-brand-text: var(--brand-text);
  --color-brand-muted: var(--brand-muted);
  --color-brand-border: var(--brand-border);

  --color-severity-green: var(--severity-green);
  --color-severity-amber: var(--severity-amber);
  --color-severity-coral: var(--severity-coral);
  --color-severity-red: var(--severity-red);
  --color-severity-suppressed: var(--severity-suppressed);

  /* Elevation tokens → `shadow-card` / `shadow-card-hover` utilities. */
  --shadow-card: var(--elevation-card);
  --shadow-card-hover: var(--elevation-card-hover);
}

html,
body {
  /* B2C page gradient (doc §1d) layered over the slate-50 base so scrolling never
   * exposes a flat canvas. White cards read as raised against the subtle sky tint. */
  background: var(--brand-bg)
    linear-gradient(
      135deg,
      #ffffff 0%,
      #f8fafc 25%,
      #f0f9ff 50%,
      #f8fafc 75%,
      #ffffff 100%
    )
    fixed;
  color: var(--brand-text);
}

body {
  /* B2C type rendering: ligatures + contextual alternates, antialiased. */
  font-feature-settings: "rlig" 1, "calt" 1;
}

* {
  border-color: var(--brand-border);
}

/* QBR / Org Health Report — print only the report card, hide app chrome. */
@media print {
  .no-print { display: none !important; }
  body * { visibility: hidden; }
  #qbr-report, #qbr-report * { visibility: visible; }
  #qbr-report { position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; }
}
````

