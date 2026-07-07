"use client";

import { Suspense, useEffect, useState } from "react";
import {
  useOverview,
  useDataConfidence,
  useMetricCells,
  useBranding,
  useOrgInsights,
  useOrgQuadrant,
  useVerifyLedger,
  useQbrAnnotations,
  useUpsertQbrAnnotation,
} from "@/lib/hooks/useDashboardData";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { owiBand, SEVERITY } from "@/lib/severity";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  Foot,
} from "@/components/ui/panels";
import type { QbrAnnotation, QbrSection } from "@/lib/graphql/types";

// VDI band tones — the data-severity ramp (green→amber→coral→red), used only as a
// data signal on the distribution bars — never as chrome.
const VDI_TONE: Record<string, string> = {
  low: "var(--severity-green)",
  moderate: "var(--severity-amber)",
  high: "var(--severity-coral)",
  critical: "var(--severity-red)",
};

const DEFAULT_PERIOD = "2026-Q2";

/**
 * Org Health Report / QBR (doc 04 reports / doc 10 §5). A print-optimised,
 * single-page report rendered entirely from the Privacy-Kernel-backed queries
 * (aggregate, k≥5, suppression intact). "Save as PDF" via the browser print
 * dialog — no individual data, ever. (Worker-side auto-PDF→S3 is the Phase-4
 * production version; this is the on-demand report.)
 *
 * Visual language (matches the redesigned Act / Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent.
 * Severity colour appears only on data (numerals, dots, bar fills) — never as
 * chrome. Sections are <SectionHeader> + one borderless elevation <Panel> with
 * hairline-divided cells; homogeneous rows read as ledgers.
 */
export default function ReportPage() {
  // useUrlFilters reads useSearchParams → must sit under a Suspense boundary so the
  // production build doesn't bail out of static prerendering (Next 16 CSR-bailout rule).
  return (
    <Suspense fallback={<div className="text-[13px] text-slate-400">Loading report…</div>}>
      <ReportContent />
    </Suspense>
  );
}

function ReportContent() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const period = state.period;
  const overview = useOverview({ period });
  const conf = useDataConfidence(period);
  const vdi = useMetricCells("VDI", "ORG", period);
  const branding = useBranding();
  const insights = useOrgInsights(period);
  const quadrant = useOrgQuadrant(period, "DEPARTMENT");
  const verify = useVerifyLedger(period);
  const annotations = useQbrAnnotations(period);

  const annStory = (annotations.data ?? []).find((a) => a.section === "story");
  const annPlan = (annotations.data ?? []).find((a) => a.section === "forward_plan");

  const o = overview.data;
  const cards = insights.data ?? [];
  const points = quadrant.data ?? [];
  const receipts = verify.data ?? [];
  const owi = o?.kpis.wellnessScore ?? null;
  const fmt = (n: number | null | undefined, suffix = "") =>
    n == null ? "—" : `${n}${suffix}`;

  return (
    <div className="space-y-8 pb-2">
      {/* Page header — no-print. */}
      <header className="no-print flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
        <div>
          <MicroLabel>Org health report</MicroLabel>
          <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
            {branding.data?.displayName ?? "Organisation"} — Wellbeing health report
          </h2>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-slate-500">
            {period} ·{" "}
            {o?.freshness.asOf
              ? `as of ${new Date(o.freshness.asOf).toLocaleDateString()}`
              : "snapshot pending"}{" "}
            · aggregate-only, k≥5
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="shrink-0 rounded-lg bg-[#1E3A5F] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#16304f]"
        >
          Download PDF
        </button>
      </header>

      {/* Printable report body. */}
      <div id="qbr-report" className="space-y-8">
        {/* ── Headline band ─────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader title="This quarter" meta={period} />
          <Panel className="grid md:grid-cols-4">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <HeadlineCell
                label="Data confidence"
                value={fmt(conf.data?.dcs)}
                hint={`validity ${fmt(conf.data?.validityPct, "%")} · trust ${fmt(conf.data?.trustQuotient)}`}
              />
            </div>
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <HeadlineCell
                label="Org wellbeing · OWI"
                value={owi == null ? null : String(owi)}
                valueColor={owi == null ? undefined : SEVERITY[owiBand(owi)]}
                hint="0–100 wellbeing index"
                pendingNote="sign-off required"
              />
            </div>
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <HeadlineCell
                label="Participation"
                value={fmt(o?.coverage?.[0]?.completedPct)}
                unit="%"
                hint="of covered lives"
              />
            </div>
            <div className="p-6">
              <HeadlineCell
                label="Response validity"
                value={fmt(conf.data?.validityPct)}
                unit="%"
                hint="valid responses"
              />
            </div>
          </Panel>
          {/* Peer benchmark — honest-pending note. */}
          <p className="flex items-start gap-2 px-1 text-[13px] leading-5 text-slate-500">
            <span
              aria-hidden
              className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300"
            />
            Peer benchmark: no peer cell yet — appears once the sector panel reaches the
            publication floor (≥8 orgs, ≥500 covered lives). Never estimated.
          </p>
        </section>

        {/* ── Story of the quarter + VDI ────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader title="Story of the quarter" />
          <Panel className="grid lg:grid-cols-3">
            <div className="border-b border-slate-100 p-6 lg:col-span-2 lg:border-b-0 lg:border-r">
              {cards.length === 0 ? (
                <p className="text-[13px] leading-relaxed text-slate-400">
                  A steady quarter — no headline metric moved materially or crossed a threshold.
                </p>
              ) : (
                <ul className="space-y-2">
                  {cards.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-start gap-2 text-[13.5px] leading-snug text-slate-900"
                    >
                      <span
                        aria-hidden
                        className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: SEVERITY[c.severity] }}
                      />
                      {c.finding}
                    </li>
                  ))}
                </ul>
              )}
              <AnnotationEditor period={period} section="story" existing={annStory} />
            </div>
            <div className="p-6">
              <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
                Vulnerability distribution
                <span className="ml-1.5 font-normal text-slate-400">VDI</span>
              </h4>
              <div className="mt-4 flex flex-col gap-3">
                {(["low", "moderate", "high", "critical"] as const).map((band) => {
                  const cell = (vdi.data ?? []).find(
                    (c) => (c.grainLabel ?? c.grainRef) === band,
                  );
                  const supp = !cell || cell.suppressed || cell.value == null;
                  const pct = supp ? null : (cell!.value as number);
                  return (
                    <div key={band} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-[12.5px] capitalize text-slate-500">
                        {band}
                      </span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct ?? 0}%`, backgroundColor: VDI_TONE[band] }}
                        />
                      </div>
                      <span className="w-11 shrink-0 text-right text-[13px] font-medium tabular-nums text-slate-900">
                        {pct == null ? "—" : `${pct}%`}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4">
                <Foot>Share of the workforce in each vulnerability band · k≥5.</Foot>
              </div>
            </div>
          </Panel>
        </section>

        {/* ── Workforce shape ───────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader title="Workforce shape" meta="k≥5 · sub-k suppressed" />
          <Panel className="grid lg:grid-cols-2">
            <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
              <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
                Wellbeing by level
              </h4>
              {(o?.byLevel ?? []).length === 0 ? (
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                  No level cells yet.
                </p>
              ) : (
                <div className="mt-4 flex flex-col gap-2.5">
                  {(o?.byLevel ?? []).map((l) => (
                    <div key={l.level} className="flex items-center gap-3">
                      <span className="w-7 text-[12.5px] font-medium text-slate-500">
                        {l.level}
                      </span>
                      {l.suppressed || l.owi == null ? (
                        <span className="flex-1 text-[12.5px] text-slate-400">
                          below threshold
                        </span>
                      ) : (
                        <>
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${l.owi}%`,
                                backgroundColor: SEVERITY[owiBand(l.owi)],
                              }}
                            />
                          </div>
                          <span className="w-10 text-right text-[13px] font-medium tabular-nums text-slate-900">
                            {l.owi}
                          </span>
                        </>
                      )}
                      <span className="w-12 text-right text-[11.5px] tabular-nums text-slate-400">
                        n={l.n}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6">
              <div className="flex items-baseline justify-between gap-2">
                <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">
                  Stress × engagement
                </h4>
                <span className="text-[11.5px] text-slate-400">by department · k≥5</span>
              </div>
              {points.length === 0 ? (
                <p className="mt-3 text-[13px] leading-relaxed text-slate-400">
                  Building — each department plots once perceived stress (PSS-10) and work
                  engagement (UWES) are both live at k≥5. No positions are estimated.
                </p>
              ) : (
                <div className="mt-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_64px_88px_76px] gap-3 border-b border-slate-100 pb-2">
                    <MicroLabel>Department</MicroLabel>
                    <MicroLabel>
                      <span className="block text-right">Stress</span>
                    </MicroLabel>
                    <MicroLabel>
                      <span className="block text-right">Engagement</span>
                    </MicroLabel>
                    <MicroLabel>
                      <span className="block text-right">Quadrant</span>
                    </MicroLabel>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {points.map((p) => {
                      const stressed = (p.stress ?? 0) >= 50;
                      const engaged = (p.engagement ?? 0) >= 50;
                      const quad =
                        !stressed && engaged
                          ? "Thriving"
                          : stressed && engaged
                            ? "Straining"
                            : !stressed && !engaged
                              ? "Coasting"
                              : "Burning";
                      return (
                        <div
                          key={p.grainRef ?? p.label}
                          className="grid grid-cols-[minmax(0,1fr)_64px_88px_76px] items-baseline gap-3 py-2.5 text-[13px] leading-5"
                        >
                          <span className="min-w-0 truncate text-slate-900">{p.label}</span>
                          <span className="text-right tabular-nums text-slate-900">
                            {p.stress ?? "—"}
                          </span>
                          <span className="text-right tabular-nums text-slate-900">
                            {p.engagement ?? "—"}
                          </span>
                          <span className="text-right text-slate-500">{quad}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </Panel>
        </section>

        {/* ── Burnout risk × department × 4 quarters — honest-pending shell. ── */}
        <section className="space-y-3">
          <SectionHeader title="Burnout risk by department" meta="BRI · last 4 quarters · k≥5" />
          <Panel className="overflow-hidden">
            {(() => {
              const quarters = lastFourQuarters(period);
              const depts = points.length > 0 ? points.map((p) => p.label) : ["—"];
              return (
                <>
                  <div className="overflow-x-auto">
                    <div className="min-w-[560px]">
                      <div className="grid grid-cols-[minmax(0,1fr)_repeat(4,96px)] gap-3 border-b border-slate-100 px-6 py-2.5">
                        <MicroLabel>Department</MicroLabel>
                        {quarters.map((q) => (
                          <MicroLabel key={q}>
                            <span className="block text-right">{q}</span>
                          </MicroLabel>
                        ))}
                      </div>
                      <div className="divide-y divide-slate-100">
                        {depts.map((d) => (
                          <div
                            key={d}
                            className="grid grid-cols-[minmax(0,1fr)_repeat(4,96px)] items-baseline gap-3 px-6 py-3 text-[13px] leading-5"
                          >
                            <span className="min-w-0 truncate text-slate-900">{d}</span>
                            {quarters.map((q) => (
                              <span key={q} className="text-right text-slate-400">
                                pending
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 px-6 py-3.5">
                    <Foot>
                      The Burnout-Risk Index has not published yet — every cell is honestly
                      pending. Trajectories appear once BRI is live at k≥5; none are estimated.
                    </Foot>
                  </div>
                </>
              );
            })()}
          </Panel>
        </section>

        {/* ── Intervention receipts — precision ledger. ─────────────────── */}
        <section className="space-y-3">
          <SectionHeader
            title="Intervention receipts"
            meta={receipts.length > 0 ? `${receipts.length} metrics · before → after` : undefined}
          />
          {receipts.length === 0 ? (
            <Panel className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-medium text-slate-900">No outcome receipts yet</p>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                A receipt needs a before and an after, so the first one appears once a second
                quarter is published at k≥5. Movement is never estimated.
              </p>
            </Panel>
          ) : (
            <Panel className="overflow-hidden">
              <div className="hidden border-b border-slate-100 px-6 py-2.5 md:grid md:grid-cols-[minmax(0,1fr)_64px_64px_72px_110px] md:gap-4">
                <MicroLabel>Metric · cohort</MicroLabel>
                <MicroLabel>
                  <span className="block text-right">Before</span>
                </MicroLabel>
                <MicroLabel>
                  <span className="block text-right">After</span>
                </MicroLabel>
                <MicroLabel>
                  <span className="block text-right">Δ</span>
                </MicroLabel>
                <MicroLabel>
                  <span className="block text-right">95% CI</span>
                </MicroLabel>
              </div>
              <div className="divide-y divide-slate-100">
                {receipts.map((r) => {
                  const tone =
                    r.direction === "flat"
                      ? "var(--brand-muted)"
                      : r.direction === "improved"
                        ? SEVERITY.green
                        : r.state === "alert"
                          ? SEVERITY.red
                          : SEVERITY.coral;
                  const sign = r.delta != null && r.delta > 0 ? "+" : "";
                  return (
                    <div
                      key={`${r.metricKey}:${r.grain}:${r.grainRef ?? "org"}`}
                      className="flex flex-col gap-1.5 px-6 py-3 md:grid md:grid-cols-[minmax(0,1fr)_64px_64px_72px_110px] md:items-baseline md:gap-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium leading-5 text-slate-900">
                          {r.metricLabel}
                          <span className="ml-1 font-normal text-slate-400">
                            · {r.cohortLabel}
                          </span>
                        </p>
                      </div>
                      <span className="text-[13px] tabular-nums text-slate-500 md:text-right">
                        {r.beforeValue ?? "—"}
                      </span>
                      <span className="text-[13px] tabular-nums text-slate-900 md:text-right">
                        {r.afterValue ?? "—"}
                      </span>
                      <span
                        className="text-[13px] font-semibold tabular-nums md:text-right"
                        style={{ color: tone }}
                      >
                        {r.delta == null ? "—" : `${sign}${r.delta}`}
                      </span>
                      <span className="text-[12px] tabular-nums text-slate-400 md:text-right">
                        {r.ciLower != null && r.ciUpper != null
                          ? `[${r.ciLower}, ${r.ciUpper}]`
                          : "pending"}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-slate-100 px-6 py-3.5">
                <Foot>
                  Movement is measured; intervention attribution is unlinked until the ACT
                  programmes engine books Plays. CIs shown for rate metrics only.
                </Foot>
              </div>
            </Panel>
          )}
        </section>

        {/* ── Forward plan ──────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader title="Forward plan" />
          <Panel className="p-6">
            {cards.length === 0 ? (
              <p className="text-[13px] leading-relaxed text-slate-400">
                No specific action recommended this quarter — sustain current rhythms and keep
                closing the loop with employees.
              </p>
            ) : (
              <ol className="space-y-2">
                {cards.map((c, i) => (
                  <li
                    key={c.id}
                    className="flex items-baseline gap-3 text-[13.5px] leading-relaxed text-slate-900"
                  >
                    <span className="shrink-0 text-[12.5px] font-medium tabular-nums text-slate-400">
                      {i + 1}
                    </span>
                    {c.play}
                  </li>
                ))}
              </ol>
            )}
            <AnnotationEditor period={period} section="forward_plan" existing={annPlan} />
          </Panel>
        </section>

        {/* ── Methodology & privacy colophon. ───────────────────────────── */}
        <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
          <MicroLabel>Methodology &amp; data confidence</MicroLabel>
          <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
            <li>
              DCS{" "}
              <span className="tabular-nums text-slate-700">{fmt(conf.data?.dcs)}</span> · response
              validity{" "}
              <span className="tabular-nums text-slate-700">{fmt(conf.data?.validityPct, "%")}</span>{" "}
              · trust quotient{" "}
              <span className="tabular-nums text-slate-700">{fmt(conf.data?.trustQuotient)}</span>
              {conf.data?.lowConfidence ? " — treat as directional." : "."}
            </li>
            <li>
              <span className="font-medium text-slate-700">Privacy gate (rule of five).</span>{" "}
              Every figure is an aggregate of ≥5 people; cohorts below the threshold are
              suppressed and omitted — never imputed.
            </li>
            <li>
              <span className="font-medium text-slate-700">Publish gate.</span>{" "}
              Only signed-off (is_active) metrics with a published snapshot contribute a value;
              pre-sign-off indices (e.g. OWI / BRI) read &ldquo;pending&rdquo;, never a draft
              number.
            </li>
            <li>
              <span className="font-medium text-slate-700">Confidence.</span>{" "}
              Deltas carry a 95% CI for rate metrics only; composite/count metrics show
              &ldquo;pending&rdquo; rather than an invented interval.
            </li>
            <li>
              <span className="font-medium text-slate-700">Metric definitions.</span>{" "}
              Validated instruments at their published versions — PSS-10, UWES, WHO-5, VDI, Trust
              Quotient, Response-Validity, Participation.
            </li>
          </ul>
          <p className="pt-1 text-[11.5px] leading-relaxed text-slate-400">
            All figures are aggregate (k≥5); cohorts under 5 are suppressed and omitted. No
            individual responses, scores, or risk appear in this report. Generated{" "}
            {new Date().toLocaleDateString()}.
          </p>
        </footer>
      </div>
    </div>
  );
}

/** Headline band cell: micro-label, 34px tabular numeral, quiet hint. Severity
 *  colour lands only on the numeral (data), never on chrome. */
function HeadlineCell({
  label,
  value,
  unit,
  hint,
  valueColor,
  pendingNote,
}: {
  label: string;
  value: string | null;
  unit?: string;
  hint?: string;
  valueColor?: string;
  pendingNote?: string;
}) {
  const pending = value == null || value === "—";
  return (
    <div className="flex h-full flex-col gap-1.5">
      <MicroLabel>{label}</MicroLabel>
      {pending ? (
        <>
          <span className="text-[34px] font-semibold leading-10 text-slate-300">—</span>
          <span className="text-[12px] leading-4 text-slate-500">
            {pendingNote ? `pending — ${pendingNote}` : hint}
          </span>
        </>
      ) : (
        <>
          <span
            className="text-[34px] font-semibold leading-10 tracking-[-0.02em] tabular-nums text-slate-900"
            style={valueColor ? { color: valueColor } : undefined}
          >
            {value}
            {unit && <span className="ml-0.5 text-[17px] font-medium text-slate-400">{unit}</span>}
          </span>
          {hint && <span className="text-[12px] leading-4 text-slate-500">{hint}</span>}
        </>
      )}
    </div>
  );
}

/** The period and the three quarters before it (e.g. "2026-Q2" → Q3'25…Q2'26), for the
 *  4-quarter heatmap shell. Pure string arithmetic — no fabricated data. */
function lastFourQuarters(period: string): string[] {
  const m = /^(\d{4})-Q([1-4])$/.exec(period);
  if (!m) return [period];
  let year = Number(m[1]);
  let q = Number(m[2]);
  const out: string[] = [];
  for (let i = 0; i < 4; i++) {
    out.unshift(`${year}-Q${q}`);
    q -= 1;
    if (q === 0) { q = 4; year -= 1; }
  }
  return out;
}

/**
 * Analyst-annotation tier (WS-L residuals, b2b_77): an editable employer override on
 * the QBR's two narrative sections (§2 story, §6 forward plan). A published override
 * prints as the analyst's paragraph; the editor itself is no-print. The write is
 * gated server-side to employer admins (hr_ops/org_admin) — a non-admin's save returns
 * 'forbidden' and is surfaced inline. The entitlement TIER (Growth/Enterprise) that
 * unlocks editing is a deferred decision (D-FLAG); the gate here is the simple
 * employer-admin one. Aggregate-only: this is the org's prose, never a person's data.
 */
const SECTION_LABEL: Record<QbrSection, string> = {
  story: "Story of the quarter",
  forward_plan: "Forward plan",
};

function AnnotationEditor({
  period,
  section,
  existing,
}: {
  period: string;
  section: QbrSection;
  existing: QbrAnnotation | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState(existing?.body ?? "");
  const upsert = useUpsertQbrAnnotation();

  // keep the textarea in sync when the fetched annotation arrives/changes.
  useEffect(() => {
    setBody(existing?.body ?? "");
  }, [existing?.body, existing?.id]);

  const published =
    existing && existing.status === "published" && existing.body.trim().length > 0;
  const err =
    upsert.error instanceof Error
      ? upsert.error.message
      : (upsert.data && upsert.data.ok === false ? upsert.data.error : null);

  return (
    <div className="mt-4">
      {/* The published override prints with the report — quiet hairline-topped prose. */}
      {published && (
        <div className="border-t border-slate-100 pt-3">
          <MicroLabel>Analyst note</MicroLabel>
          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-700">
            {existing!.body}
          </p>
        </div>
      )}

      {/* The editor affordance is no-print. */}
      <div className="no-print mt-2">
        {!open ? (
          <button
            onClick={() => setOpen(true)}
            className="text-[12.5px] font-medium text-[#1E3A5F] underline-offset-2 hover:underline"
          >
            {published ? "Edit analyst note" : `Add an analyst note to "${SECTION_LABEL[section]}"`}
          </button>
        ) : (
          <div className="space-y-2">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="Add the human paragraph for this section — published notes print on the report."
              className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-[13px] leading-relaxed text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#1E3A5F]"
            />
            <div className="flex items-center gap-1">
              <button
                disabled={upsert.isPending}
                onClick={() =>
                  upsert.mutate(
                    { period, section, body, status: "published" },
                    { onSuccess: () => setOpen(false) },
                  )
                }
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/[0.05] disabled:text-slate-300 disabled:hover:bg-transparent"
              >
                {upsert.isPending ? "Saving…" : "Publish note"}
              </button>
              <button
                disabled={upsert.isPending}
                onClick={() =>
                  upsert.mutate({ period, section, body, status: "draft" })
                }
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-100/70 disabled:text-slate-300"
              >
                Save draft
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-[13px] font-medium text-slate-400 transition-colors hover:bg-slate-100/70"
              >
                Cancel
              </button>
            </div>
            {err && (
              <p className="text-[12px] leading-4" style={{ color: SEVERITY.red }}>
                {err === "forbidden"
                  ? "You don't have permission to edit notes (employer admins only)."
                  : err}
              </p>
            )}
            <Foot>
              Editing is an analyst-tier feature (Growth/Enterprise) — entitlement gating is
              pending; saves are restricted to employer admins server-side.
            </Foot>
          </div>
        )}
      </div>
    </div>
  );
}
