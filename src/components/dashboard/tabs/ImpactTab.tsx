"use client";

import { cn } from "@/lib/utils";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  Foot,
  BandDot,
  PanelSkeleton,
} from "@/components/ui/panels";
import {
  useOrgRoi,
  useOverview,
  useMetricCells,
  useOrgRating,
  useRecoveryYield,
  useDecisionCost,
  useValidityTier,
  useOrgBenchmarkDelta,
  useOrgSectorPack,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { HintTip } from "@/components/ui/HintTip";
import { GLOSSARY } from "@/lib/glossary";
import type { ReactNode } from "react";
import type { DashboardFilters, OrgRoi, RoiTerm, DecisionCostRow } from "@/lib/graphql/types";

/**
 * Impact tab (doc 10 §4.4) — all aggregate (k≥5). ROI runs on MoodScale-owned
 * data (WPAI-GH + OWI Δ + Attrition Risk), labelled as self-reported (D5).
 * HRMS-verified ROI is a Phase-2 upsell and is OMITTED (never an empty
 * "pending integration" placeholder).
 *
 * Visual language (matches the redesigned Act/Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent.
 * Severity colour appears only on data (numerals, band dots) — never as chrome.
 * Borderless elevation panels; hairline dividers carry the structure. Pending /
 * suppressed states stay honest prose — never a fabricated value.
 */

export function ImpactTab({ filters }: { filters: DashboardFilters }) {
  const roi = useOrgRoi(filters.period);
  // The ROI panel below is the real Impact surface (get_org_roi). The headline cells
  // carry no literals: Wellness Improvement is the OWI Δ from the `overview` resolver
  // (null until OWI is ratified + a baseline quarter exists); the other three have no
  // aggregated source yet, so they stay honest "pending" cells (D5 — never a fake %).
  const overview = useOverview(filters);
  const kpis = overview.data?.kpis;
  // Presenteeism cost (WPAI-derived, ₹/yr) — published employer metric, org-grain.
  const presenteeism = useMetricCells("PRESENTEEISM_COST", "ORG", filters.period);
  const presenteeismCell = presenteeism.data?.[0];
  const wellnessDelta = kpis?.wellnessDelta ?? null;

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Impact &amp; ROI</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          What the programme returned
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          Outcomes and return computed on MoodScale-owned, self-reported data (WPAI-GH, OWI Δ,
          attrition risk) at k≥5 aggregates. A figure appears only when its source is live — until
          then the cell says so honestly.
        </p>
      </header>

      {/* ── Headline outcomes ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Headline outcomes"
          meta={<HintTip tip={GLOSSARY.D5}>{`${filters.period} · self-reported (D5)`}</HintTip>}
        />
        <Panel className="grid md:grid-cols-5">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OutcomeCell
              label="Wellness improvement"
              value={wellnessDelta}
              unit="pts"
              delta={wellnessDelta}
              pendingNote={<HintTip tip={GLOSSARY.OWI}>OWI sign-off + baseline quarter</HintTip>}
              foot={<HintTip tip={GLOSSARY.OWI}>OWI vs baseline</HintTip>}
            />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OutcomeCell
              label="Burnout risk reduction"
              value={null}
              unit="%"
              pendingNote="needs therapy-cohort outcomes"
              foot="therapy vs non-therapy (k≥5)"
            />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OutcomeCell
              label="Work-life balance (L1)"
              value={null}
              pendingNote={<HintTip tip={GLOSSARY["WLI-5"]}>WLI-5 not yet aggregated</HintTip>}
              foot={<HintTip tip={GLOSSARY["WLI-5"]}>WLI-5</HintTip>}
            />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OutcomeCell
              label="Psych safety (L3)"
              value={null}
              pendingNote={
                <HintTip tip={GLOSSARY.Edmondson}>Edmondson 7-item not yet aggregated</HintTip>
              }
              foot={<HintTip tip={GLOSSARY.Edmondson}>Edmondson exec 7-item</HintTip>}
            />
          </div>
          <div className="p-6">
            <OutcomeCell
              label="Presenteeism cost"
              value={
                presenteeismCell && !presenteeismCell.suppressed && presenteeismCell.value != null
                  ? inr(presenteeismCell.value)
                  : null
              }
              suppressed={presenteeismCell?.suppressed}
              pendingNote={<HintTip tip={GLOSSARY.WPAI}>WPAI-derived cost — accruing</HintTip>}
              foot={
                <HintTip tip={GLOSSARY["WPAI-GH"]}>annualised presenteeism ₹ (WPAI-GH)</HintTip>
              }
            />
          </div>
        </Panel>
      </section>

      {/* ── Programme ROI (doc 11) ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Programme ROI" meta="baseline → current · org-grain" />
        {roi.isLoading ? <PanelSkeleton /> : <RoiPanel roi={roi.data} />}
      </section>

      {/* ── WS-O O3 — Help-Seeking latency + conversion ("months → weeks") ── */}
      <section className="space-y-3">
        <SectionHeader title="Help-seeking — flag to care" meta="paired guardrails · k≥5" />
        <HelpSeekingSection period={filters.period} />
      </section>

      {/* ── G4 — Org Rating + Recovery Yield + Decision Cost, tier-gated ──── */}
      <RiskImpactSections period={filters.period} />

      {/* ── Notes colophon (honest scaffolding) ─────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Absent by design.</span>{" "}
            HRMS-verified ROI rows — omitted until connected (never an empty placeholder, D5).
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Therapy vs No-Therapy Outcomes, Before/After by Level, EI Dimensions (CM-4/DF-4/DTS),
            L1 Work Engagement — wired in a later phase.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── headline outcome cell ───────────────────────────────────────────────── */

function OutcomeCell({
  label,
  value,
  unit,
  delta,
  suppressed = false,
  pendingNote,
  foot,
}: {
  label: string;
  value: string | number | null;
  unit?: string;
  delta?: number | null;
  suppressed?: boolean;
  pendingNote?: ReactNode;
  foot: ReactNode;
}) {
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {suppressed || (value === null && !pendingNote) ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Cohort under 5 — suppressed for anonymity.
        </p>
      ) : value === null ? (
        <>
          <span className="text-[26px] font-semibold leading-8 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">pending — {pendingNote}</span>
        </>
      ) : (
        <>
          <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
            {value}
            {unit && <span className="ml-1 text-[14px] font-medium text-slate-400">{unit}</span>}
          </span>
          {typeof delta === "number" && (
            <span
              className="text-[12px] font-medium leading-4 tabular-nums"
              style={{ color: delta >= 0 ? SEVERITY.green : SEVERITY.coral }}
            >
              {delta >= 0 ? "+" : ""}
              {delta} pts vs prior quarter
            </span>
          )}
        </>
      )}
      <div className="mt-auto pt-1">
        <Foot>{foot}</Foot>
      </div>
    </div>
  );
}

/* ── Programme ROI (doc 11) — multiple + the three savings terms ─────────── */

const inr = (n: number | null) =>
  n == null
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
        notation: "compact",
      }).format(n);

function deltaLabel(term: RoiTerm): string {
  if (term.delta == null) return "—";
  const sign = term.delta > 0 ? "+" : "";
  if (term.label === "Presenteeism") return `${sign}${term.delta} pts recovery`;
  if (term.label === "Absence") return `${term.delta} days`;
  return `${(term.delta * 100).toFixed(0)} pp`; // attrition rate → percentage points
}

function RoiPanel({ roi }: { roi: OrgRoi | undefined }) {
  if (!roi) return null;
  const terms = [roi.presenteeism, roi.absence, roi.attrition];

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 p-6">
        <span className="flex items-baseline gap-2.5">
          <span className="text-[34px] font-semibold leading-10 tracking-[-0.02em] tabular-nums text-slate-900">
            {roi.roiMultiple == null ? "—" : `${roi.roiMultiple.toFixed(2)}×`}
          </span>
          <span className="text-[13px] text-slate-400">return multiple</span>
        </span>
        {roi.lowConfidence && (
          <BandDot color={SEVERITY.amber} label="low confidence — needs baseline + WPAI-GH" />
        )}
      </div>

      <div className="grid border-t border-slate-100 sm:grid-cols-3">
        {terms.map((t, i) => (
          <div
            key={t.label}
            className={cn(
              "p-6",
              i < terms.length - 1 && "border-b border-slate-100 sm:border-b-0 sm:border-r",
            )}
          >
            <MicroLabel>{t.label}</MicroLabel>
            <p className="mt-1.5 text-[20px] font-semibold leading-7 tracking-[-0.02em] tabular-nums text-slate-900">
              {inr(t.savings)}
            </p>
            <p className="mt-0.5 text-[12px] leading-4 tabular-nums text-slate-500">
              {deltaLabel(t)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          {roi.label} (presenteeism + absence) + <HintTip tip={GLOSSARY.OWI}>OWI Δ</HintTip> +
          Attrition Risk, baseline → current.
          Connect an HRMS to replace estimates with verified attendance (Phase-2 upsell).
        </Foot>
      </div>
    </Panel>
  );
}

/* ── WS-O O3 — Help-Seeking latency + conversion ─────────────────────────── */
// The "months → weeks" story: how fast a risk flag turns into care (latency, DAYS,
// lower=better) and what share of flagged members actually engage (conversion %,
// higher=better). Anti-Goodhart guardrail pair — you cannot shrink latency by
// narrowing the flag set without dropping conversion. CALM gradient only.

// help_seeking_latency_band: days, lower=better (green≤14 / amber≤42 / coral>42).
function latencyTone(d: number): string {
  if (d <= 14) return SEVERITY.green;
  if (d <= 42) return SEVERITY.amber;
  return SEVERITY.coral;
}
// conversion %: higher=better (calm gradient; green≥70 / amber≥40 / coral<40).
function convTone(p: number): string {
  if (p >= 70) return SEVERITY.green;
  if (p >= 40) return SEVERITY.amber;
  return SEVERITY.coral;
}

function HelpSeekingSection({ period }: { period: string }) {
  const latency = useMetricCells("HELP_SEEKING_LATENCY", "ORG", period);
  const conversion = useMetricCells("HELP_SEEKING_CONVERSION", "ORG", period);

  if (latency.isLoading || conversion.isLoading) return <PanelSkeleton />;
  if (latency.isError || conversion.isError)
    return (
      <Panel className="px-6 py-8 text-center">
        <p className="text-[13.5px] font-medium" style={{ color: SEVERITY.red }}>
          Could not load help-seeking — refresh to retry.
        </p>
      </Panel>
    );

  const lat = latency.data?.[0];
  const conv = conversion.data?.[0];

  return (
    <Panel className="overflow-hidden">
      <div className="grid sm:grid-cols-2">
        <div className="border-b border-slate-100 p-6 sm:border-b-0 sm:border-r">
          <HelpSeekingStat
            label="Time to care"
            unit="days"
            cell={lat}
            toneOf={latencyTone}
            empty="needs flag→care data"
          />
        </div>
        <div className="p-6">
          <HelpSeekingStat
            label="Conversion"
            unit="%"
            cell={conv}
            toneOf={convTone}
            empty="needs flag→care data"
          />
        </div>
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          Median days from a risk flag to engaging care, and the share of flagged members who
          engage. Paired guardrails — speed without coverage is not progress.
        </Foot>
      </div>
    </Panel>
  );
}

function HelpSeekingStat({
  label,
  unit,
  cell,
  toneOf,
  empty,
}: {
  label: string;
  unit: string;
  cell?: { value: number | null; suppressed: boolean; n: number } | undefined;
  toneOf: (v: number) => string;
  empty: string;
}) {
  const suppressed = !cell || cell.suppressed || cell.value == null;
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {suppressed ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          {cell && cell.suppressed
            ? "Below threshold (k<5) — suppressed for anonymity."
            : `Pending — ${empty}.`}
        </p>
      ) : (
        <span className="flex items-baseline gap-1.5">
          <span
            className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
            style={{ color: toneOf(cell!.value as number) }}
          >
            {cell!.value}
          </span>
          <span className="text-[13px] text-slate-400">{unit}</span>
          <span className="ml-2 text-[11.5px] tabular-nums text-slate-400">n={cell!.n}</span>
        </span>
      )}
    </div>
  );
}

/* ── G4 — Risk & impact (WAVE-4) ─────────────────────────────────────────── */
// Aggregate-only (k≥5 IN-DB) wrappers over Privacy-Kernel RPCs: Org Rating
// (psychosocial-hazard index, reads blank when too few constructs), Recovery
// Yield (RCI per 1,000 covered lives), Decision Cost Ledger (cohort OWI delta
// per leadership decision, 95% CI, below-k rows suppressed). The Tiered-Validity
// gate frames the whole surface: unless the period's tier is 'full', peer
// benchmarks are suppressed — own-org values still show.

const BAND_COLOR: Record<string, string> = {
  green: SEVERITY.green,
  amber: SEVERITY.amber,
  coral: SEVERITY.coral,
};

function ratingTone(band: string | null): string {
  return (band && BAND_COLOR[band]) ?? SEVERITY.suppressed;
}

function RiskImpactSections({ period }: { period: string }) {
  const rating = useOrgRating(period);
  const yield_ = useRecoveryYield();
  const decisions = useDecisionCost();
  const validity = useValidityTier(period);
  const benchmark = useOrgBenchmarkDelta("OWI", period);
  const sector = useOrgSectorPack();

  if (rating.isLoading || yield_.isLoading || decisions.isLoading)
    return (
      <section className="space-y-3">
        <SectionHeader title="Risk & impact" />
        <PanelSkeleton className="h-72" />
      </section>
    );
  if (rating.isError || yield_.isError || decisions.isError || validity.isError)
    return (
      <section className="space-y-3">
        <SectionHeader title="Risk & impact" />
        <Panel className="px-6 py-8 text-center">
          <p className="text-[13.5px] font-medium" style={{ color: SEVERITY.red }}>
            Could not load risk &amp; impact — refresh to retry.
          </p>
        </Panel>
      </section>
    );

  // Tiered-validity gate — full tier alone publishes confident benchmark deltas.
  const benchmarksVisible = validity.data?.benchmarksVisible ?? false;
  const tier = validity.data?.tier ?? null;
  const r = rating.data;
  const y = yield_.data;
  const rows: DecisionCostRow[] = decisions.data?.decisions ?? [];

  return (
    <>
      <section className="space-y-3">
        <SectionHeader title="Risk & impact" meta="k≥5 · tier-gated benchmarks" />
        <Panel className="overflow-hidden">
          {/* Tiered-validity framing strip */}
          {validity.data && validity.data.status === "ok" && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-6 py-3.5">
              <span className="text-[13px] leading-5 text-slate-600">
                Participation validity —{" "}
                <span className="font-medium text-slate-900">{tier ?? "—"}</span>
                {validity.data.participationPct != null && (
                  <span className="tabular-nums text-slate-400">
                    {" "}
                    · {validity.data.participationPct}% completed
                  </span>
                )}
              </span>
              <span className="text-[11.5px] leading-5 text-slate-400">
                {benchmarksVisible && benchmark.data?.benchmarksVisible ? (
                  <>
                    vs peers (n={benchmark.data.nOrgs}): median {benchmark.data.p50}
                    {benchmark.data.position &&
                      ` · you're ${benchmark.data.position.replace(/_/g, " ")}`}
                  </>
                ) : benchmarksVisible ? (
                  "benchmarks unlocked — peer cell still below floor"
                ) : tier === "diagnosis" ? (
                  "below validity floor — Participation Diagnosis (benchmarks withheld)"
                ) : (
                  "directional only — peer benchmarks suppressed"
                )}
              </span>
            </div>
          )}

          {/* Sector framing (the org's assigned sector pack) */}
          {sector.data?.assigned && (
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-6 py-3.5">
              <span className="text-[13px] leading-5 text-slate-600">
                Sector framing —{" "}
                <span className="font-medium text-slate-900">{sector.data.name}</span>
              </span>
              {sector.data.kpiOverlays.length > 0 && (
                <span className="text-[11.5px] leading-5 text-slate-400">
                  {sector.data.kpiOverlays
                    .slice(0, 3)
                    .map((o) => o.label)
                    .join(" · ")}
                </span>
              )}
            </div>
          )}

          {/* Org Rating + Recovery Yield */}
          <div className="grid md:grid-cols-2">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <div className="flex h-full flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <MicroLabel>Org rating · hazard index</MicroLabel>
                  {r?.k != null && (
                    <span className="text-[11.5px] tabular-nums text-slate-400">k≥{r.k}</span>
                  )}
                </div>
                {!r || r.suppressed || r.hazardIndex == null ? (
                  <p className="text-[13px] leading-relaxed text-slate-400">
                    {r?.reason === "insufficient_constructs"
                      ? `Coverage too thin to rate (${r?.constructsPresent ?? 0}/${r?.constructsConfigured ?? 0} constructs) — never a fabricated score.`
                      : "Not yet ratable for this period — never a fabricated score."}
                  </p>
                ) : (
                  <>
                    <span className="flex items-baseline gap-2.5">
                      <span
                        className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
                        style={{ color: ratingTone(r.band) }}
                      >
                        {r.hazardIndex}
                      </span>
                      {r.band && (
                        <BandDot
                          color={ratingTone(r.band)}
                          label={`${r.band.charAt(0).toUpperCase()}${r.band.slice(1)} band`}
                        />
                      )}
                    </span>
                    <span className="text-[12px] leading-4 tabular-nums text-slate-500">
                      {r.constructsPresent}/{r.constructsConfigured} constructs
                      {r.coverage != null && ` · ${Math.round(r.coverage * 100)}% coverage`}
                    </span>
                  </>
                )}
                <div className="mt-auto pt-1">
                  <Foot>
                    Psychosocial-hazard / insurer index (0–100, higher = more hazard) over the
                    configured {r?.standard ?? "ISO 45003 / PRA"} constructs.
                  </Foot>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="flex h-full flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <MicroLabel>Recovery yield / 1k lives</MicroLabel>
                  {y?.k != null && (
                    <span className="text-[11.5px] tabular-nums text-slate-400">k≥{y.k}</span>
                  )}
                </div>
                {!y || y.suppressed || y.recoveryYieldPer1000 == null ? (
                  <p className="text-[13px] leading-relaxed text-slate-400">
                    {y && y.coveredLives != null
                      ? `Below threshold across ${y.coveredLives} covered lives — yield withheld.`
                      : "No covered-lives cohort yet."}
                  </p>
                ) : (
                  <>
                    <span className="flex items-baseline gap-1.5">
                      <span
                        className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
                        style={{ color: SEVERITY.green }}
                      >
                        {y.recoveryYieldPer1000}
                      </span>
                      <span className="text-[13px] text-slate-400">/ 1,000 lives</span>
                    </span>
                    <span className="text-[12px] leading-4 tabular-nums text-slate-500">
                      {y.reliableImprovements ?? "—"} reliable · {y.coveredLives ?? "—"} covered
                    </span>
                  </>
                )}
                <div className="mt-auto pt-1">
                  <Foot>
                    <HintTip tip={GLOSSARY.RCI}>Reliable clinical improvements (RCI)</HintTip> per
                    1,000 covered lives, {y?.window ?? "trailing 12m"}. Reads blank below the privacy
                    floor.
                  </Foot>
                </div>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      {/* Decision Cost Ledger */}
      <section className="space-y-3">
        <SectionHeader
          title="Decision cost ledger"
          meta={
            rows.length > 0 ? (
              <HintTip tip={GLOSSARY.OWI}>{`${rows.length} decisions · OWI points · 95% CI`}</HintTip>
            ) : undefined
          }
        />
        {rows.length === 0 ? (
          <Panel className="px-6 py-10 text-center">
            <p className="text-[13.5px] font-medium text-slate-900">
              No leadership decisions logged yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
              The ledger attributes a wellbeing delta (OWI points, 95% CI) to each leadership
              decision — before vs after the affected cohort — once one is logged with a
              measurable cohort window.
            </p>
          </Panel>
        ) : (
          <Panel className="overflow-hidden">
            <div className="divide-y divide-slate-100">
              {rows.map((d) => (
                <DecisionRow key={d.id ?? d.decisionKey ?? d.title} row={d} />
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-3.5">
              <Foot>
                Each below-k row is suppressed (delta withheld); confounders are noted, not
                hidden.
              </Foot>
            </div>
          </Panel>
        )}
      </section>
    </>
  );
}

function DecisionRow({ row: d }: { row: DecisionCostRow }) {
  const suppressed = d.suppressed || d.owiDelta == null;
  // OWI is higher-is-better, so a negative attributed delta is the costly direction.
  const tone =
    d.owiDelta == null ? SEVERITY.suppressed : d.owiDelta < 0 ? SEVERITY.red : SEVERITY.green;
  const sign = d.owiDelta != null && d.owiDelta > 0 ? "+" : "";
  return (
    <div className="flex flex-col gap-2 px-6 py-4 md:grid md:grid-cols-[minmax(0,1fr)_150px_190px] md:items-center md:gap-4">
      <div className="min-w-0">
        <p className="truncate text-[14px] font-medium leading-5 text-slate-900">
          {d.title ?? d.decisionKey ?? "Decision"}
        </p>
        <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
          {d.decisionType ?? "—"}
          {d.evidenceGrade ? ` · grade ${d.evidenceGrade}` : ""}
          {d.confounderNote ? ` · ${d.confounderNote}` : ""}
        </p>
      </div>
      {suppressed ? (
        <p className="text-[12.5px] leading-5 text-slate-400 md:col-span-2 md:text-right">
          Cohort below threshold — attributed cost withheld
          {d.nPost != null && ` (n=${d.nPost})`}.
        </p>
      ) : (
        <>
          <div className="md:text-right">
            <p className="text-[14px] font-semibold leading-5 tabular-nums" style={{ color: tone }}>
              {sign}
              {d.owiDelta} OWI
            </p>
            {d.ciLow != null && d.ciHigh != null && (
              <p className="mt-0.5 text-[12px] leading-4 tabular-nums text-slate-400">
                95% CI [{d.ciLow}, {d.ciHigh}]
              </p>
            )}
          </div>
          <div className="md:text-right">
            <p className="text-[13px] leading-5 tabular-nums text-slate-700">
              {d.preOwi ?? "—"} → {d.postOwi ?? "—"}
            </p>
            <p className="mt-0.5 text-[12px] leading-4 tabular-nums text-slate-400">
              {d.prePeriod ?? "—"} → {d.postPeriod ?? "—"} · n={d.nPost ?? "—"}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
