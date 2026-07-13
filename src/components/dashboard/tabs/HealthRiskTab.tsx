"use client";

import {
  Panel,
  SectionHeader,
  MicroLabel,
  MicroStat,
  CellTitle,
  KeyValueRow,
  Foot,
  BandDot,
  CellSkeleton,
  PanelSkeleton,
} from "@/components/ui/panels";
import {
  useMetricCells,
  useOverview,
  useFilterOptions,
} from "@/lib/hooks/useDashboardData";
import { useThermocline } from "@/lib/northstar";
import { useIsLeadership } from "@/lib/hooks/useViewerClaims";
import { SEVERITY, gradientColor, owiBand } from "@/lib/severity";
import { HintTip } from "@/components/ui/HintTip";
import { cn } from "@/lib/utils";
import { Gate } from "@/lib/hooks/useCapabilities";
import type { DashboardFilters, MetricCell, MetricKey } from "@/lib/graphql/types";

/**
 * Health & Risk tab (doc 10 §4.2). Aggregate-only (k≥5). The Ashu "Big Five
 * Profile" and "Flagged High-Risk Individuals" panels are deliberately ABSENT —
 * BFI-10 is red-line and individual risk is Tier-1 internal, never employer.
 *
 * Visual language (matches the redesigned Act and Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent.
 * Severity colour appears ONLY on data (numerals, band dots, bar fills) — never
 * as chrome. Boxes are borderless elevation panels; hairline dividers and column
 * alignment carry the structure. Every pending / suppressed state stays honest.
 */

export function HealthRiskTab({ filters }: { filters: DashboardFilters }) {
  // Headline KPIs come from the same Privacy-Kernel-backed `overview` resolver the
  // Overview tab uses — never literals. Each is null until its instrument is in the
  // battery / clinically ratified, and renders as an honest "pending" stat.
  const overview = useOverview(filters);
  const kpis = overview.data?.kpis;
  const highStress = kpis?.highStressPct ?? null;
  const highStressBreached = (highStress ?? 0) > 20; // discrete alert → red OK

  const mhsf = useMetricCells("MHSF", "DEPARTMENT", filters.period);
  const vdi = useMetricCells("VDI", "ORG", filters.period);
  // Risk distribution by level (doc 10 §4.2): high-stress share per L1/L2/L3, k≥5.
  // PSS is the risk metric with level-grain data today; OBI is omitted (not yet seeded).
  const pssByLevel = useMetricCells("PSS_HIGH_PCT", "LEVEL", filters.period);

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Health &amp; risk</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Where the strain sits — without naming anyone
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          Clinical vulnerability, stress and burnout share, and the dynamic risk signals — all
          group aggregates at k≥5. No individual responses, scores, or risk flags ever appear
          here.
        </p>
      </header>

      {/* ── Headline band — the four risk KPIs ─────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="This quarter" meta="aggregate-only · k≥5" />
        {overview.isLoading ? (
          <PanelSkeleton />
        ) : (
          <Panel className="grid md:grid-cols-4">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              {/* MHSF-III is not yet in the core battery — no honest org mean exists. */}
              <HeadlineStat
                label="Avg MHSF-III"
                value={null}
                pendingNote="MHSF-III not yet in the battery"
                hint="flag if < 65"
                glossary="MHSF-III · Mental Health Screening Form"
                tooltip="Avg MHSF-III — mean of the Mental Health Screening Form (third revision), an aggregate-safe screen (0–100, higher is better); a cohort flags for review below 65."
              />
            </div>
            <Gate cap="metric:OBI_HIGH_PCT">
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <HeadlineStat
                  label="High burnout"
                  value={kpis?.burnoutRiskPct ?? null}
                  unit="%"
                  pendingNote="OBI p75/p90 after Wave-1 (B3)"
                  hint="OBI ≥ p75 share"
                  glossary="OBI · Oldenburg Burnout Inventory (OLBI)"
                  tooltip="High Burnout — the share of respondents whose OLBI (Oldenburg Burnout Inventory: exhaustion + disengagement) sits at or above the Wave-1 75th percentile. Formula: members ≥ p75 ÷ scored members × 100."
                />
              </div>
            </Gate>
            <Gate cap="metric:PSS_HIGH_PCT">
              <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
                <HeadlineStat
                  label="High stress"
                  value={highStress}
                  unit="%"
                  pendingNote="needs PSS-10 in the battery"
                  hint="PSS ≥ 68 share"
                  alert={highStressBreached ? "above 20% threshold" : undefined}
                  glossary="PSS-10 · Perceived Stress Scale"
                  tooltip="High Stress — the share of respondents whose PSS-10 (Perceived Stress Scale, 10 items → 0–100) is in the high band (≥68, Cohen). Formula: high-band members ÷ scored members × 100."
                />
              </div>
            </Gate>
            <Gate cap="metric:BRS">
              <div className="p-6">
                {/* Resilience (BRS) is not yet seeded/aggregated — pending, never invented. */}
                <HeadlineStat
                  label="Avg resilience"
                  value={null}
                  pendingNote="BRS not yet in the battery"
                  hint="BRS (L2 + L3)"
                  glossary="BRS · Brief Resilience Scale"
                  tooltip="Avg Resilience — mean of the Brief Resilience Scale (BRS: ability to bounce back from stress), aggregated for L2 + L3 cohorts (k≥5). Pending until the BRS module is in the battery."
                />
              </div>
            </Gate>
          </Panel>
        )}
      </section>

      {/* ── Vulnerability distribution (VDI) ───────────────────────────────── */}
      <Gate cap="metric:VDI">
        <section className="space-y-3">
          <SectionHeader
            title="Vulnerability distribution"
            meta="% of cohort per clinical band · calm gradient"
          />
          {vdi.isLoading ? <PanelSkeleton /> : <VdiPanel cells={vdi.data ?? []} />}
        </section>
      </Gate>

      {/* ── Department signal — participation / validity / trust ledger ────── */}
      <section className="space-y-3">
        <SectionHeader title="Department signal" meta="calm gradient · k≥5" />
        <DepartmentLedger period={filters.period} />
      </section>

      {/* ── Clinical & stress spread — MHSF by dept + PSS by level ─────────── */}
      <section className="space-y-3">
        <SectionHeader title="Clinical & stress spread" meta="sub-k cells suppressed" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            {mhsf.isLoading ? (
              <CellSkeleton />
            ) : (
              <MhsfByDepartmentCell cells={mhsf.data ?? []} />
            )}
          </div>
          <div className="p-6">
            {/* Risk distribution by level — % high-stress (PSS) per L1/L2/L3. Lower is
                better; cells with n<5 suppressed. OBI by level is omitted until seeded. */}
            {pssByLevel.isLoading ? (
              <CellSkeleton />
            ) : (
              <StressByLevelCell cells={pssByLevel.data ?? []} />
            )}
          </div>
        </Panel>
      </section>

      {/* ── Structure & leadership signals ─────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Structure & leadership" />
        <Panel className="grid md:grid-cols-3">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            {/* WS-W W — Thermocline: how far an upward stress signal travels across
                l1→l2→l3 before it attenuates. Aggregate-only (k≥5). */}
            <ThermoclineCell period={filters.period} />
          </div>
          <Gate cap="metric:MANAGER_CALIBRATION">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              {/* WS-O O2 — Manager Calibration (KRI, l3_only; gated to leadership). */}
              <ManagerCalibrationCell period={filters.period} />
            </div>
          </Gate>
          <Gate cap="metric:MANAGER_CERT_GAP">
            <div className="p-6">
              {/* WS-U U5 — certified-vs-uncertified manager wellbeing gap (l3-only, b2b_281). */}
              <ManagerCertGapCell period={filters.period} />
            </div>
          </Gate>
        </Panel>
      </section>

      {/* ── Dynamic signals (WS-O b2b_277/278) ─────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Dynamic signals" meta="governed metrics · honest-or-pending" />
        <Panel className="grid md:grid-cols-2 lg:grid-cols-4">
          <Gate cap="metric:SLEEP_INDEX">
            <div className="border-b border-slate-100 p-6 md:border-r lg:border-b-0">
              <SleepIndexCell period={filters.period} />
            </div>
          </Gate>
          <Gate cap="metric:RECOVERY_HALF_LIFE">
            <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
              <RecoveryHalfLifeCell period={filters.period} />
            </div>
          </Gate>
          <Gate cap="metric:PULSE_VOLATILITY">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <PulseVolatilityCell period={filters.period} />
            </div>
          </Gate>
          <Gate cap="metric:MOODCAST">
            <div className="p-6">
              <MoodCastCell period={filters.period} />
            </div>
          </Gate>
          <Gate cap="metric:HEALTHY_STEP_DOWN_RATE">
            <div className="border-t border-slate-100 p-6 md:border-r lg:border-t lg:border-r-0 lg:[grid-column:1]">
              <HealthyStepDownCell period={filters.period} />
            </div>
          </Gate>
        </Panel>
      </section>

      {/* ── Notes colophon — honest scaffolding (doc 10 §8) ────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Absent by design.</span>{" "}
            Big Five Profile (BFI-10 is red-line — never employer-facing).
          </li>
          <li>
            <span className="font-medium text-slate-700">Absent by design.</span>{" "}
            Flagged High-Risk Individuals (Tier-1 internal only).
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── headline stat (mirrors the Overview headline band) ─────────────────────── */

function HeadlineStat({
  label,
  value,
  unit,
  hint,
  pendingNote,
  alert,
  glossary,
  tooltip,
}: {
  label: string;
  value: number | null;
  unit?: string;
  hint?: string;
  pendingNote?: string;
  alert?: string;
  glossary?: string; // full form of the short form (bottom line)
  tooltip?: string; // full explanation + formula, on hover
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
      {(glossary || (pending && hint)) && (
        <div className="mt-auto pt-1">
          <Foot>{glossary ? <HintTip tip={tooltip}>{glossary}</HintTip> : hint}</Foot>
        </div>
      )}
    </div>
  );
}

/* ── VDI: Vulnerability Distribution (doc 05 §4.1) ───────────────────────────
   % of cohort per clinical band (worst of PHQ-9/GAD-7). CONTINUOUS gradient —
   green→amber→coral, NEVER red (doc 10 §2.1). Sub-k bands render "below threshold". */

const VDI_ORDER = ["low", "moderate", "high", "critical"] as const;
const VDI_LABEL: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  critical: "Critical",
};
const VDI_COLOR: Record<string, string> = {
  low: SEVERITY.green,
  moderate: SEVERITY.amber,
  high: SEVERITY.coral,
  critical: SEVERITY.coral, // top-of-ramp stays coral — never red on a gradient
};

function VdiPanel({ cells }: { cells: MetricCell[] }) {
  const byBand = new Map(cells.map((c) => [String(c.grainLabel ?? c.grainRef), c]));
  const maxPct = Math.max(
    1,
    ...cells.filter((c) => !c.suppressed && c.value != null).map((c) => c.value as number),
  );

  return (
    <Panel className="p-6">
      <div className="flex flex-col gap-2.5">
        {VDI_ORDER.map((band) => {
          const c = byBand.get(band);
          const suppressed = !c || c.suppressed || c.value == null;
          const pct = suppressed ? 0 : (c!.value as number);
          return (
            <div key={band} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[12.5px] font-medium text-slate-500">
                {VDI_LABEL[band]}
              </span>
              {suppressed ? (
                <span className="flex-1 text-[12.5px] text-slate-400">below threshold</span>
              ) : (
                <>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(pct / maxPct) * 100}%`,
                        backgroundColor: VDI_COLOR[band],
                      }}
                    />
                  </div>
                  <span className="w-14 shrink-0 text-right text-[13px] font-medium tabular-nums text-slate-900">
                    {pct.toFixed(1)}%
                  </span>
                </>
              )}
              <span className="w-12 shrink-0 text-right text-[11.5px] tabular-nums text-slate-400">
                {suppressed ? "" : `n=${c!.n}`}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-4">
        <Foot>
          Distribution of clinical vulnerability across the workforce (worst of PHQ-9 / GAD-7).
          Bands with fewer than 5 people are suppressed.
        </Foot>
      </div>
    </Panel>
  );
}

/* ── Department ledger (doc 04 §L3 / doc 10 §4) ──────────────────────────────
   Per-department aggregate cells (participation / validity / trust). Continuous
   values → calm gradient (green→amber→coral, NEVER red). Sub-k cells show "—". */

const DEPT_COLS: { key: MetricKey; label: string }[] = [
  { key: "PARTICIPATION_PCT", label: "Participation" },
  { key: "RESPONSE_VALIDITY_RATE", label: "Validity" },
  { key: "TRUST_QUOTIENT", label: "Trust" },
];

const DEPT_GRID = "grid grid-cols-[minmax(0,1fr)_84px_84px_84px] items-baseline gap-4";

function DepartmentLedger({ period }: { period: string }) {
  const part = useMetricCells("PARTICIPATION_PCT", "DEPARTMENT", period);
  const valid = useMetricCells("RESPONSE_VALIDITY_RATE", "DEPARTMENT", period);
  const trust = useMetricCells("TRUST_QUOTIENT", "DEPARTMENT", period);
  const filters = useFilterOptions();

  const loading = part.isLoading || valid.isLoading || trust.isLoading || filters.isLoading;
  if (loading) return <PanelSkeleton />;
  if (part.isError || valid.isError || trust.isError || filters.isError)
    return (
      <Panel className="px-6 py-6">
        <p className="text-[13px]" style={{ color: SEVERITY.red }}>
          Could not load the department signal — refresh to retry.
        </p>
      </Panel>
    );

  const byMetric: Record<string, Map<string, MetricCell>> = {
    PARTICIPATION_PCT: indexCells(part.data),
    RESPONSE_VALIDITY_RATE: indexCells(valid.data),
    TRUST_QUOTIENT: indexCells(trust.data),
  };
  const deptName = new Map((filters.data?.departments ?? []).map((d) => [d.id, d.label]));
  // departments = union of dept ids seen across the three metrics
  const deptIds = Array.from(
    new Set(
      [part.data, valid.data, trust.data]
        .flatMap((cells) => (cells ?? []).map((c) => c.grainRef))
        .filter((x): x is string => !!x),
    ),
  );

  if (deptIds.length === 0) {
    return (
      <Panel className="px-6 py-8">
        <p className="text-[13px] leading-relaxed text-slate-400">
          No department cells for this period.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className={cn("border-b border-slate-100 px-6 py-2.5", DEPT_GRID)}>
        <MicroLabel>Department</MicroLabel>
        {DEPT_COLS.map((c) => (
          <MicroLabel key={c.key}>
            <span className="block text-right">{c.label}</span>
          </MicroLabel>
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {deptIds.map((id) => (
          <div key={id} className={cn("px-6 py-3", DEPT_GRID)}>
            <span className="min-w-0 truncate text-[13.5px] font-medium text-slate-900">
              {deptName.get(id) ?? id.slice(0, 8)}
            </span>
            {DEPT_COLS.map((c) => (
              <LedgerValue key={c.key} cell={byMetric[c.key]?.get(id)} />
            ))}
          </div>
        ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          Higher is better on all three. Sub-k cells (n&lt;5) show &ldquo;—&rdquo;, suppressed
          for anonymity.
        </Foot>
      </div>
    </Panel>
  );
}

function indexCells(cells?: MetricCell[]): Map<string, MetricCell> {
  return new Map((cells ?? []).filter((c) => c.grainRef).map((c) => [c.grainRef as string, c]));
}

function LedgerValue({ cell }: { cell?: MetricCell }) {
  if (!cell || cell.suppressed || cell.value == null) {
    return (
      <span
        className="block text-right text-[13px] text-slate-300"
        title="below reporting threshold (n<5)"
      >
        —
      </span>
    );
  }
  return (
    <span
      className="block text-right text-[14px] font-semibold tabular-nums"
      style={{ color: gradientColor(cell.value, true) }} // higher = better for all three
    >
      {cell.value.toFixed(0)}
    </span>
  );
}

/* ── Clinical & stress spread cells ──────────────────────────────────────────── */

function MhsfByDepartmentCell({ cells }: { cells: MetricCell[] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="higher is better">MHSF-III by department</CellTitle>
      {cells.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          No department cells for this period.
        </p>
      ) : (
        <div>
          {cells.map((c) => {
            const suppressed = c.suppressed || c.value == null;
            return (
              <div
                key={`${c.grain}:${c.grainRef ?? "org"}`}
                className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5"
              >
                <span className="min-w-0 truncate text-slate-600">{c.grainLabel ?? "—"}</span>
                {suppressed ? (
                  <span className="shrink-0 text-slate-400">below threshold</span>
                ) : (
                  <span className="flex shrink-0 items-baseline gap-2">
                    <span
                      className="font-semibold tabular-nums"
                      style={{ color: gradientColor(c.value as number, true) }}
                    >
                      {c.value}
                    </span>
                    <span className="text-[11.5px] tabular-nums text-slate-400">n={c.n}</span>
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>Red-free gradient · cells with n&lt;5 suppressed.</Foot>
      </div>
    </div>
  );
}

function StressByLevelCell({ cells }: { cells: MetricCell[] }) {
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="lower is better">High-stress share by level</CellTitle>
      {cells.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          No level cells for this period — appears once PSS-10 aggregates exist at k≥5 per
          level.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cells.map((c) => {
            const suppressed = c.suppressed || c.value == null;
            return (
              <div key={`${c.grain}:${c.grainRef ?? "org"}`} className="flex items-center gap-3">
                <span className="w-7 shrink-0 text-[12.5px] font-medium text-slate-500">
                  {c.grainLabel ?? c.grainRef ?? "—"}
                </span>
                {suppressed ? (
                  <span className="flex-1 text-[12.5px] text-slate-400">below threshold</span>
                ) : (
                  <>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(100, c.value as number)}%`,
                          backgroundColor: gradientColor(c.value as number, false),
                        }}
                      />
                    </div>
                    <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-slate-900">
                      {c.value}%
                    </span>
                  </>
                )}
                <span className="w-10 shrink-0 text-right text-[11.5px] tabular-nums text-slate-400">
                  {suppressed ? "" : `n=${c.n}`}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>PSS ≥ 68 share · k≥5 per level · OBI by level is omitted until seeded.</Foot>
      </div>
    </div>
  );
}

/* ── Thermocline (WS-W W) ────────────────────────────────────────────────────
   How far an upward stress/strain signal travels before it attenuates across the
   org's levels (l1→l2→l3), off a published banded source metric (default
   PSS_HIGH_PCT), from get_org_thermocline. Per-layer values are already
   employer-visible published cells (k-safe). Honest-or-pending; calm gradient. */

function thermoPct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 1000) / 10}%`;
}

const BAND_TONE: Record<string, string> = {
  green: SEVERITY.green,
  amber: SEVERITY.amber,
  coral: SEVERITY.coral,
};

function ThermoclineCell({ period }: { period: string }) {
  const q = useThermocline(period);
  const data = q.data;

  if (q.isLoading) return <CellSkeleton />;
  if (q.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load the thermocline — refresh to retry.
      </p>
    );

  const computed = data?.profile === "computed";

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={
          computed && data?.thermoclineBoundary ? (
            <BandDot color={SEVERITY.amber} label={`break at ${data.thermoclineBoundary}`} />
          ) : (
            "pending"
          )
        }
      >
        Thermocline profile
      </CellTitle>

      {!computed || !data ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          This lights up once at least two org levels have a published, k-safe band on{" "}
          {data?.sourceMetric ?? "the source metric"} — it then shows where an upward stress
          signal attenuates across the hierarchy. Aggregate-only.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {data.layers.map((l) => (
              <div key={l.level} className="flex items-center gap-3">
                <span className="w-7 shrink-0 text-[12.5px] font-medium text-slate-500">
                  {l.level}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (l.value ?? 0) * 100)}%`,
                      backgroundColor: l.band
                        ? BAND_TONE[l.band] ?? "var(--brand-muted)"
                        : "var(--brand-muted)",
                    }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-[13px] font-medium tabular-nums text-slate-900">
                  {thermoPct(l.value)}
                </span>
              </div>
            ))}
          </div>
          <div>
            {data.boundaries.map((b) => (
              <KeyValueRow
                key={b.boundary}
                label={`${b.boundary} attenuation`}
                value={thermoPct(b.attenuation)}
              />
            ))}
          </div>
        </>
      )}

      <div className="mt-auto pt-1">
        <Foot>
          Source: {data?.sourceMetric ?? "PSS_HIGH_PCT"} banded layers · sharp-drop ≥
          {data?.sharpDropThreshold != null
            ? `${Math.round(data.sharpDropThreshold * 100)}%`
            : "40%"}{" "}
          · k≥{data?.k ?? 5} · aggregate-only.
        </Foot>
      </div>
    </div>
  );
}

/* ── Manager calibration (WS-O O2, KRI, l3_only) ─────────────────────────────
   Median divergence between a manager's OWN OWI and their team's k≥5 aggregate —
   the "everything-is-fine manager" signal. Manager-COHORT grain only (double
   k≥5) — NEVER an individual manager. Gated to LEADERSHIP (l3) in the UI; the
   API/RPC publish-gate + is_active is the real wall. CALM gradient. */

// manager_calibration_band: OWI-pt divergence, positive=risk (green≤5/amber≤15/coral>15).
function calibrationTone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 15) return SEVERITY.amber;
  return SEVERITY.coral;
}
function calibrationLabel(v: number): string {
  if (v <= 5) return "well-calibrated";
  if (v <= 15) return "some drift";
  return "calibration gap";
}

function ManagerCalibrationCell({ period }: { period: string }) {
  const isLeadership = useIsLeadership();
  // Always call the hook (rules of hooks); we simply don't render its data when
  // the viewer is not leadership.
  const org = useMetricCells("MANAGER_CALIBRATION", "ORG", period);

  if (!isLeadership) {
    return (
      <div className="flex h-full flex-col gap-3">
        <CellTitle state="leadership only">Manager calibration</CellTitle>
        <p className="text-[13px] leading-relaxed text-slate-400">
          Leadership-only (L3). This calibration signal is restricted to senior leaders.
        </p>
      </div>
    );
  }

  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load manager calibration — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="leadership only">Manager calibration</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 managers (each with a k≥5 team) before a cohort number is shown."
            : "Pending — appears once a manager hierarchy is in place and the metric is published (governed risk metric)."}
        </p>
      ) : (
        <MicroStat
          label="OWI-pt divergence"
          value={<span style={{ color: calibrationTone(v) }}>{v}</span>}
          hint={`${calibrationLabel(v)} · manager cohort n=${cell!.n}`}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Median gap between a manager&apos;s own wellbeing reading and their team&apos;s
          aggregate. Cohort-level only — never an individual manager. green ≤5 · amber ≤15.
        </Foot>
      </div>
    </div>
  );
}

/* ── Certified-manager wellbeing gap (KHI, WS-U U5, b2b_281) ─────────────────
   Average team-OWI of D30-CERTIFIED managers minus UNCERTIFIED — a positive gap
   is the certification paying off. Org-grain, l3-only, double k≥5 or suppressed;
   never names a manager. CALM gradient. */

// manager_cert_gap_band: OWI-pt gap, positive=good. green ≥8 / amber ≥3 / coral <3.
function certGapTone(v: number): string {
  if (v >= 8) return SEVERITY.green;
  if (v >= 3) return SEVERITY.amber;
  return SEVERITY.coral;
}

function ManagerCertGapCell({ period }: { period: string }) {
  const org = useMetricCells("MANAGER_CERT_GAP", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load the certification gap — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Certified-manager wellbeing gap</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — appears once ≥5 certified and ≥5 uncertified managers each have a k≥5 team.
          Leadership-only; never names a manager.
        </p>
      ) : (
        <MicroStat
          label="OWI pts"
          value={<span style={{ color: certGapTone(v) }}>{v > 0 ? `+${v}` : v}</span>}
          hint={`${cell!.n} managers`}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Team-OWI of D30-certified managers vs uncertified — the certification proof. Positive
          = certified managers&apos; teams fare better. Aggregate only, k≥5, l3-only. good ≥8
          pts.
        </Foot>
      </div>
    </div>
  );
}

/* ── Dynamic signals (WS-O b2b_277/278) — sleep, recovery, volatility, forecast ── */

// favourability band, higher=better: thriving ≥75 / steady ≥50 / strained <50.
function sleepTone(v: number): string {
  if (v >= 75) return SEVERITY.green;
  if (v >= 50) return SEVERITY.amber;
  return SEVERITY.coral;
}

function SleepIndexCell({ period }: { period: string }) {
  const org = useMetricCells("SLEEP_INDEX", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load the sleep index — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Sleep index</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          {cell && cell.suppressed
            ? "Below the reporting threshold — needs at least 5 responders before an index is shown."
            : "Pending — appears once the ISI sleep module is administered (governed wellbeing metric)."}
        </p>
      ) : (
        <MicroStat
          label="Favourability"
          value={
            <span style={{ color: sleepTone(v) }}>
              {v}
              <span className="ml-0.5 text-[14px] font-medium text-slate-400">/100</span>
            </span>
          }
          hint={`n=${cell!.n}`}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Cohort sleep health (ISI → 0–100 favourability, higher = better sleep). Aggregate
          only, k≥5. thriving ≥75 · steady ≥50.
        </Foot>
      </div>
    </div>
  );
}

// recovery_half_life_band: quarters, lower=faster=better. green ≤1 / amber ≤2 / coral >2.
function recoveryTone(v: number): string {
  if (v <= 1) return SEVERITY.green;
  if (v <= 2) return SEVERITY.amber;
  return SEVERITY.coral;
}

function RecoveryHalfLifeCell({ period }: { period: string }) {
  const org = useMetricCells("RECOVERY_HALF_LIFE", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load recovery half-life — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Recovery half-life</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — appears after ≥3 published quarters that contain a completed dip→recovery.
          A dynamic metric: shown honestly, never estimated early.
        </p>
      ) : (
        <MicroStat
          label={v === 1 ? "Quarter to bounce back" : "Quarters to bounce back"}
          value={<span style={{ color: recoveryTone(v) }}>{v}</span>}
          hint={cell!.lowConfidence ? "low confidence" : undefined}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          How fast the org climbs back halfway from an OWI dip — resilience speed. Aggregate
          only, k≥5. faster ≤1 quarter.
        </Foot>
      </div>
    </div>
  );
}

// pulse_volatility_band: SD, lower=more stable=better. green ≤5 / amber ≤10 / coral >10.
function volatilityTone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 10) return SEVERITY.amber;
  return SEVERITY.coral;
}

function PulseVolatilityCell({ period }: { period: string }) {
  const org = useMetricCells("PULSE_VOLATILITY", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load pulse volatility — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Pulse volatility</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — appears after ≥2 monthly pulses (each with at least 5 responders). A dynamic
          risk signal: shown honestly once there is enough history.
        </p>
      ) : (
        <MicroStat
          label="SD across months"
          value={<span style={{ color: volatilityTone(v) }}>{v}</span>}
          hint={`n=${cell!.n}${cell!.lowConfidence ? " · low confidence" : ""}`}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Month-to-month swing in the cohort pulse — lower is steadier; high volatility flags
          churn/instability worth a look. Aggregate only, k≥5. steady ≤5.
        </Foot>
      </div>
    </div>
  );
}

/* MoodCast (KHI, WS-O O5, b2b_278) — honest next-quarter OWI forecast; abstains
   (pending) under 3 published quarters. Uses the OWI calm bands. */

function MoodCastCell({ period }: { period: string }) {
  const org = useMetricCells("MOODCAST", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load MoodCast — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={!suppressed && v != null && cell!.lowConfidence ? "low confidence" : undefined}
      >
        MoodCast — next quarter
      </CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — a forecast appears only after ≥3 published quarters of OWI history. Shipped
          honestly with its confidence, never a fabricated point estimate.
        </p>
      ) : (
        <MicroStat
          label="Projected OWI"
          value={<span style={{ color: SEVERITY[owiBand(v)] }}>{v}</span>}
          hint="next quarter"
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Next quarter&apos;s Organisational Wellbeing Index, projected from the published
          trend. Honest-or-null: wide/withheld when history is thin. Aggregate only, k≥5.
        </Foot>
      </div>
    </div>
  );
}

/* Healthy Step-Down Rate (b2b_350 registry metric — no prior UI). Share of cohort
   members who de-escalate from a high-stress reading back to a healthy band across
   consecutive periods. Higher = more of the workforce recovers on its own. */

// healthy_step_down_rate_band: %, higher=better. green ≥60 / amber ≥35 / coral <35.
function stepDownTone(v: number): string {
  if (v >= 60) return SEVERITY.green;
  if (v >= 35) return SEVERITY.amber;
  return SEVERITY.coral;
}

function HealthyStepDownCell({ period }: { period: string }) {
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
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Healthy step-down rate</CellTitle>
      {suppressed || v == null ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Pending — appears once ≥2 consecutive periods of pulse data exist to trace a
          high-stress → healthy transition.
        </p>
      ) : (
        <MicroStat
          label="De-escalated on their own"
          value={<span style={{ color: stepDownTone(v) }}>{v}%</span>}
          hint={`n=${cell!.n}${cell!.lowConfidence ? " · low confidence" : ""}`}
        />
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Share of a high-stress cohort that returns to a healthy band the following period.
          Aggregate only, k≥5. thriving ≥60%.
        </Foot>
      </div>
    </div>
  );
}
