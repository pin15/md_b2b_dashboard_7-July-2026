"use client";

import { Suspense } from "react";
import { cn } from "@/lib/utils";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  CellTitle,
  Foot,
  BandDot,
  PanelSkeleton,
} from "@/components/ui/panels";
import { useImpactVerdict, useRepeatLessonRate } from "@/lib/evidence/hooks";
import { useEvidenceLadder } from "@/lib/evidence/ladderHooks";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { SEVERITY } from "@/lib/severity";
import type { ImpactVerdict, ImpactVerdictRow } from "@/lib/evidence/api";
import type { EvidenceLevel, EvidenceLadderRow } from "@/lib/evidence/ladder";

const DEFAULT_PERIOD = "2026-Q2";

/**
 * Evidence / Outcomes surface (MIOS §9, migration b2b_295) — the "proof-not-promises"
 * governance loop made visible to the employer reader:
 *
 *   1. Impact P&L  — the 4-state Scale/Fix/Hold/Retire verdict per programme.
 *   2. Evidence ladder — the E0..E5 rung declaring how strong the proof behind it is.
 *   3. Kill review — the decision record (advocate vs executioner → verdict).
 *   4. Outcomes ledger + learning library — retired programmes' effect sizes/CIs,
 *      published misses, RCAs, and the repeat-lesson rate.
 *
 * Employer-blind by construction: every figure here is a programme-level aggregate
 * (k≥5 in-DB), never a person, never clinical content. On the replica the verdicts and
 * effect sizes are honestly null/pending — this surface builds the MECHANISM; the
 * numbers light up with real spend, completed programmes, and a second quarter.
 *
 * Visual language (matches the redesigned Act/Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent. Semantic
 * colour appears only on data (verdict dots, rung tones, the repeat-rate numeral) —
 * never as chrome. Borderless elevation panels; hairline dividers carry structure.
 */
export default function EvidencePage() {
  return (
    <Suspense fallback={<PanelSkeleton className="h-64" />}>
      <EvidenceContent />
    </Suspense>
  );
}

function EvidenceContent() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const period = state.period;

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Evidence &amp; outcomes</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Proof, not promises
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          {period} · the MoodScale Impact Operating System. Every figure is a programme-level
          aggregate at k≥5, employer-blind. Numbers appear with verified outcomes — never
          estimated.
        </p>
      </header>

      {/* ── 1 · Impact P&L — the Scale / Fix / Hold / Retire call ─────────── */}
      <ImpactVerdictSection period={period} />

      {/* ── 2 · Evidence ladder — how strong the proof is ─────────────────── */}
      <EvidenceLadderSection period={period} />

      {/* ── 3 · Kill review — the decision record ─────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Kill review" meta="decision record" />
        <Panel className="overflow-hidden">
          <div className="border-b border-slate-100 p-6">
            <p className="max-w-3xl text-[13px] leading-relaxed text-slate-500">
              Every programme that can&apos;t show Level&nbsp;3–4 movement is argued before the
              Impact council: an <span className="font-medium text-slate-700">advocate</span>{" "}
              makes the case to keep or scale it, an{" "}
              <span className="font-medium text-slate-700">executioner</span> makes the case to
              retire it, and the council records a verdict. No open reviews this period — the
              record fills as programmes reach a verified second quarter and a council sits.
            </p>
          </div>
          <dl className="grid sm:grid-cols-3">
            <div className="border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
              <dt>
                <MicroLabel>Advocate argument</MicroLabel>
              </dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                The case to keep / scale
              </dd>
            </div>
            <div className="border-b border-slate-100 px-6 py-4 sm:border-b-0 sm:border-r">
              <dt>
                <MicroLabel>Executioner argument</MicroLabel>
              </dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                The case to retire
              </dd>
            </div>
            <div className="px-6 py-4">
              <dt>
                <MicroLabel>Verdict + decision date</MicroLabel>
              </dt>
              <dd className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
                Scale / Fix / Hold / Retire
              </dd>
            </div>
          </dl>
        </Panel>
      </section>

      {/* ── 4 · Outcomes ledger + learning library ────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="The record" meta="retired programmes · lessons" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OutcomesLedgerCell />
          </div>
          <div className="p-6">
            <LearningLibraryCell />
          </div>
        </Panel>
      </section>

      {/* ── Notes colophon ─────────────────────────────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Employer-blind by construction.</span>{" "}
            All figures are programme-level aggregates (k≥5). No individual responses, scores,
            clinical content, or person↔org joins appear on this surface (FORCE-RLS,
            employer-reader own-org only).
          </li>
          <li>
            <span className="font-medium text-slate-700">Honest-or-blank.</span>{" "}
            A verdict abstains to Hold without verified evidence; effect sizes, CIs, and
            cost-per-outcome stay blank — never fabricated — where a cohort is suppressed or no
            comparison exists.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── 1 · Impact P&L ──────────────────────────────────────────────────────── */

// scale = grow it (green), fix = needs work (navy — no amber/orange), hold = keep
// watching (neutral slate), retire = stop it (red, a discrete kill decision).
const VERDICT_TONE: Record<ImpactVerdict, string> = {
  scale: SEVERITY.green,
  fix: "var(--brand-primary)",
  hold: "var(--brand-muted)",
  retire: SEVERITY.red,
};

const VERDICT_LABEL: Record<ImpactVerdict, string> = {
  scale: "Scale",
  fix: "Fix",
  hold: "Hold",
  retire: "Retire",
};

function fmtMoney(v: number | null): string {
  if (v == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `INR ${Math.round(v).toLocaleString()}`;
  }
}

const VERDICT_COLS = "md:grid md:grid-cols-[minmax(0,1fr)_110px_140px_220px] md:items-start md:gap-4";

function ImpactVerdictSection({ period }: { period: string }) {
  const verdict = useImpactVerdict(period, null);

  const pending = verdict.data?.pending ?? false;
  const rows: ImpactVerdictRow[] = verdict.data?.rows ?? [];

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Impact P&L"
        meta={rows.length > 0 ? `${rows.length} programmes graded` : "Scale · Fix · Hold · Retire"}
      />
      {verdict.isLoading ? (
        <PanelSkeleton />
      ) : pending ? (
        <Panel className="px-6 py-10 text-center">
          <p className="text-[13.5px] font-medium text-slate-900">
            The verdict engine is built — numbers pending
          </p>
          <p className="mx-auto mt-1 max-w-lg text-[12.5px] leading-relaxed text-slate-400">
            Each booked programme gets a four-state call — Scale (grow it), Fix (needs work), Hold
            (keep watching), Retire (stop it) — over cost-per-outcome, effect size, and trend. The
            engine (<Code>get_org_impact_verdict</Code>) is in place; figures appear once the
            gateway field is wired and a programme has a verified second-quarter movement to grade
            — never estimated.
          </p>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="text-[13.5px] font-medium text-slate-900">
            No booked programmes to grade yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
            A verdict needs a booked programme and a verified before→after reading at k≥5. Until
            then there is nothing to call Scale, Fix, Hold, or Retire.
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          <div
            className={cn(
              "hidden border-b border-slate-100 px-6 py-2.5 md:grid",
              VERDICT_COLS.replace("md:grid ", ""),
            )}
          >
            <MicroLabel>Programme</MicroLabel>
            <MicroLabel>
              <span className="block text-right">Δ (verified)</span>
            </MicroLabel>
            <MicroLabel>
              <span className="block text-right">Cost / outcome</span>
            </MicroLabel>
            <MicroLabel>
              <span className="block text-right">Verdict</span>
            </MicroLabel>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div
                key={r.catalogueKey + (r.interventionId ?? "")}
                className={cn("flex flex-col gap-3 px-6 py-4", VERDICT_COLS)}
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium leading-5 text-slate-900">
                    {r.interventionName}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
                    {r.productLine ?? "—"} · {r.targetMetricKey ?? "—"}
                  </p>
                </div>
                <p className="text-[14px] font-semibold leading-5 tabular-nums text-slate-900 md:text-right">
                  {r.delta == null ? (
                    <span className="font-normal text-slate-400">—</span>
                  ) : (
                    `${r.delta > 0 ? "+" : ""}${r.delta}`
                  )}
                </p>
                <p className="text-[13px] leading-5 tabular-nums text-slate-700 md:text-right">
                  {fmtMoney(r.costPerOutcome)}
                </p>
                <div className="md:text-right">
                  <BandDot color={VERDICT_TONE[r.verdict]} label={VERDICT_LABEL[r.verdict]} />
                  {r.verdictBasis && (
                    <p className="mt-1 text-[11px] leading-tight text-slate-400 md:text-right">
                      {r.verdictBasis}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-6 py-3.5">
            <Foot>
              Aggregate-only (k≥5 in-DB). The verdict abstains to Hold without verified evidence;
              cost-per-outcome is blank, never fabricated, where a cohort is suppressed or no cost
              is booked.
            </Foot>
          </div>
        </Panel>
      )}
    </section>
  );
}

/* ── 2 · Evidence ladder ─────────────────────────────────────────────────── */

const LADDER: EvidenceLevel[] = ["e0", "e1", "e2", "e3", "e4", "e5"];

const LEVEL_LABEL: Record<EvidenceLevel, string> = {
  e0: "E0 · anecdote",
  e1: "E1 · pre/post",
  e2: "E2 · matched",
  e3: "E3 · wedge",
  e4: "E4 · pooled",
  e5: "E5 · peer-reviewed",
};

// Evidence-strength encoding: pre-causal rungs (E0–E2: anecdote / pre-post / matched)
// read NEUTRAL slate ("developing"); causal-and-above (E3 stepped-wedge → E5
// peer-reviewed) read GREEN ("proven"). No amber/coral — the meaning is
// proven-vs-developing, which is clearer than six arbitrary hues.
const LEVEL_TONE: Record<EvidenceLevel, string> = {
  e0: "var(--brand-muted)",
  e1: "var(--brand-muted)",
  e2: "var(--brand-muted)",
  e3: SEVERITY.green,
  e4: SEVERITY.green,
  e5: SEVERITY.green,
};

function fmtCi(row: EvidenceLadderRow): string {
  if (row.effectSize == null) return "—";
  const eff = `${row.effectSize > 0 ? "+" : ""}${row.effectSize}`;
  if (row.ciLower == null || row.ciUpper == null) return `${eff} (CI —)`;
  return `${eff} [${row.ciLower}, ${row.ciUpper}]`;
}

const LADDER_COLS = "md:grid md:grid-cols-[minmax(0,1fr)_180px_150px_130px] md:items-start md:gap-4";

const LADDER_GUIDE =
  "E0 anecdote · E1 pre/post · E2 matched comparison · E3 stepped-wedge (causal) · E4 pooled · E5 peer-reviewed";

function EvidenceLadderSection({ period }: { period: string }) {
  const ladder = useEvidenceLadder(period);

  const pending = ladder.data?.pending ?? false;
  const rows: EvidenceLadderRow[] = ladder.data?.rows ?? [];

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Evidence ladder"
        meta={rows.length > 0 ? `${rows.length} programmes on the ladder` : "proof strength · E0–E5"}
      />
      {ladder.isLoading ? (
        <PanelSkeleton />
      ) : pending ? (
        <Panel className="px-6 py-10 text-center">
          <p className="text-[13.5px] font-medium text-slate-900">
            The ladder engine is built — rungs pending
          </p>
          <p className="mx-auto mt-1 max-w-lg text-[12.5px] leading-relaxed text-slate-400">
            For each programme, the highest honestly-supported rung with its effect size and 95%
            CI — {LADDER_GUIDE}. The engines (<Code>get_org_evidence_ladder</Code>,{" "}
            <Code>compute_evidence_record</Code>, <Code>get_org_rollout_contrast</Code>) are in
            place; each programme&apos;s rung appears once the gateway field is wired — and, by
            design, only as high as the study honestly supports. Never estimated.
          </p>
        </Panel>
      ) : rows.length === 0 ? (
        <Panel className="px-6 py-10 text-center">
          <p className="text-[13.5px] font-medium text-slate-900">No graded programmes yet</p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
            A rung needs a verified before→after reading at k≥5 (E1), a matched non-targeted
            sibling cohort (E2), or randomised-order rollout arms (E3). Empty is the expected
            state on a single-snapshot book.
          </p>
          <p className="mx-auto mt-3 max-w-md text-[11.5px] leading-relaxed text-slate-400">
            {LADDER_GUIDE}
          </p>
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          {/* rung rail — where the book of programmes sits on the ladder */}
          <div className="grid grid-cols-3 border-b border-slate-100 md:grid-cols-6">
            {LADDER.map((lvl, i) => {
              const count = rows.filter((r) => r.level === lvl).length;
              return (
                <div
                  key={lvl}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-3.5",
                    i > 0 && "border-l border-slate-100",
                  )}
                >
                  <span
                    className="text-[17px] font-semibold leading-6 tabular-nums"
                    style={{ color: count > 0 ? LEVEL_TONE[lvl] : undefined }}
                  >
                    <span className={count > 0 ? undefined : "text-slate-300"}>{count}</span>
                  </span>
                  <MicroLabel>{LEVEL_LABEL[lvl]}</MicroLabel>
                </div>
              );
            })}
          </div>
          <div
            className={cn(
              "hidden border-b border-slate-100 px-6 py-2.5 md:grid",
              LADDER_COLS.replace("md:grid ", ""),
            )}
          >
            <MicroLabel>Programme</MicroLabel>
            <MicroLabel>
              <span className="block text-right">Effect [95% CI]</span>
            </MicroLabel>
            <MicroLabel>
              <span className="block text-right">Design</span>
            </MicroLabel>
            <MicroLabel>
              <span className="block text-right">Rung</span>
            </MicroLabel>
          </div>
          <div className="divide-y divide-slate-100">
            {rows.map((r) => (
              <div
                key={(r.catalogueKey ?? "") + (r.interventionId ?? "") + (r.targetMetricKey ?? "")}
                className={cn("flex flex-col gap-3 px-6 py-4", LADDER_COLS)}
              >
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-medium leading-5 text-slate-900">
                    {r.catalogueKey ?? "—"}
                  </p>
                  <p className="mt-0.5 truncate text-[12px] leading-4 text-slate-500">
                    {r.productLine ?? "—"} · {r.targetMetricKey ?? "—"}
                  </p>
                </div>
                <div className="md:text-right">
                  <p className="text-[13px] font-medium leading-5 tabular-nums text-slate-900">
                    {fmtCi(r)}
                  </p>
                  {r.ciBasis && (
                    <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{r.ciBasis}</p>
                  )}
                </div>
                <p className="text-[12px] leading-5 text-slate-500 md:text-right">
                  {r.design ?? "—"}
                </p>
                <div className="md:text-right">
                  <BandDot color={LEVEL_TONE[r.level]} label={LEVEL_LABEL[r.level]} />
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-100 px-6 py-3.5">
            <Foot>
              Ladder-honest: a programme&apos;s rung is never inflated above the design that
              produced it. Aggregate-only (k≥5 in-DB). Effect &amp; CI are blank, never
              fabricated, where a cohort is suppressed or no comparison/arm exists. E3
              (stepped-wedge) reads treatment-vs-control rollout arms.
            </Foot>
          </div>
        </Panel>
      )}
    </section>
  );
}

/* ── 4 · Outcomes ledger + learning library cells ────────────────────────── */

function OutcomesLedgerCell() {
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="retired + published misses">Outcomes ledger</CellTitle>
      <p className="text-[13px] leading-relaxed text-slate-400">
        The honest public record: retired programmes with their measured effect size and 95% CI,
        and any <span className="font-medium text-slate-500">published miss</span> — a claim we
        made publicly that did not hold. Empty is the expected state until the first programme is
        retired with a verified effect.
      </p>
      <div className="mt-auto pt-1">
        <Foot>Nothing retired yet — no entries to show, none fabricated.</Foot>
      </div>
    </div>
  );
}

function LearningLibraryCell() {
  const repeat = useRepeatLessonRate();

  const rate = repeat.data?.repeatLessonRate ?? null;
  // Lower repeat-rate is better → green; otherwise neutral slate (no amber/orange).
  const rateTone = rate == null ? "var(--brand-muted)" : rate <= 0.1 ? SEVERITY.green : "var(--brand-muted)";

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Learning library</CellTitle>
      <div className="flex flex-col gap-1">
        <MicroLabel>Repeat-lesson rate</MicroLabel>
        <span
          className={cn(
            "text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums",
            rate == null && "text-slate-300",
          )}
          style={rate == null ? undefined : { color: rateTone }}
        >
          {repeat.isLoading ? "…" : rate == null ? "—" : `${(rate * 100).toFixed(0)}%`}
        </span>
        <span className="text-[12px] leading-4 text-slate-500">
          {rate == null
            ? "null on an empty library · a draft metric until the Impact council ratifies its bands"
            : "share of distinct lessons recurring across retired initiatives · lower is better"}
        </span>
      </div>
      <p className="text-[13px] leading-relaxed text-slate-400">
        Retired initiatives, each with a root-cause analysis, the negative result, and effect
        sizes / CIs / dose-response — so the next council can see the prior lesson. The
        repeat-lesson rate is the fraction of distinct lessons that recur across more than one
        retired initiative: the same mistake bought twice. No retired initiatives yet — the
        library populates as programmes are retired with a documented root-cause analysis.
      </p>
      <div className="mt-auto pt-1">
        {repeat.data?.pending ? (
          <Foot>
            <Code>get_org_repeat_lesson_rate</Code> is built; it surfaces once the gateway field
            is wired.
          </Foot>
        ) : (
          <Foot>Lessons are programme-level RCAs — never a person, never clinical content.</Foot>
        )}
      </div>
    </div>
  );
}

/* ── shared micro-bits ───────────────────────────────────────────────────── */

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-slate-100/80 px-1 py-px font-mono text-[11px] text-slate-500">
      {children}
    </code>
  );
}
