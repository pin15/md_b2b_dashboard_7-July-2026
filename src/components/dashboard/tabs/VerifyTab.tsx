"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  CellTitle,
  Foot,
  SuppressedNote,
  BandDot,
  CellSkeleton,
  PanelSkeleton,
} from "@/components/ui/panels";
import {
  useVerifyLedger,
  useGuardrailViolations,
  useMetricCells,
  useOrgCostPerOutcome,
  useOrgUnderperformingInterventions,
} from "@/lib/hooks/useDashboardData";
import { getOrgOrdi } from "@/lib/ordi/ordi";
import { getOrgFieldLens, type FieldLensSignal } from "@/lib/graphql/fieldlens";
import { SEVERITY, gradientColor } from "@/lib/severity";
import type {
  DashboardFilters,
  VerifyLedgerRow,
  CostPerOutcomeRow,
  UnderperformingInterventionRow,
} from "@/lib/graphql/types";

/**
 * VERIFY tab (doc 04 §2.3 Zone F / QBR §5 Intervention-receipt) — the Verify beat of
 * the GDAV loop: "did last quarter's movement hold?". Every row is a real before/after
 * delta from published org+department snapshot cells (k≥5 on BOTH quarters, via
 * get_verify_ledger). Aggregate-only — no individual responses/scores/risk.
 *
 * Honest-or-pending throughout:
 *  • CI shows only for true rate metrics (binomial normal approx); composite/count
 *    metrics render the delta with "CI pending" — never invented rigor.
 *  • Intervention attribution is "unlinked" until the ACT programmes engine books
 *    Plays — the ledger states measured movement, not a fabricated cause.
 *  • Empty until a second quarter is published (first-quarter framing below).
 *
 * Visual language (matches the redesigned Act/Overview tabs): typography-led,
 * near-monochrome slate, navy (#1E3A5F) as the single interactive accent. Severity
 * colour appears only on data (delta numerals, band dots) — red only on discrete
 * threshold alerts (guardrail violations, significant regressions). Boxes are
 * borderless elevation panels; hairline dividers and alignment carry the structure.
 */

/* ── page ─────────────────────────────────────────────────────────────────── */

export function VerifyTab({ filters }: { filters: DashboardFilters }) {
  const ledger = useVerifyLedger(filters.period);
  const rows = ledger.data ?? [];

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Verify &amp; receipts</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Did last quarter&apos;s movement hold?
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          Every receipt below is a real before/after reading from published snapshots —
          aggregate-only, k≥5 on both quarters. Where rigour can&apos;t be computed it says so;
          nothing here is estimated or invented.
        </p>
      </header>

      {/* ── WS-O O0/O6 — anti-Goodhart guardrail-violation strip ─────────── */}
      <GuardrailSection period={filters.period} />

      {/* ── G3 trust/divergence beat — reported climate vs reality ───────── */}
      <section className="space-y-3">
        <SectionHeader title="Trust & candour" meta="k≥5 aggregates · never an individual" />
        <Panel className="grid md:grid-cols-3">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <ChannelDivergenceCell period={filters.period} />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <OrdiCell />
          </div>
          <div className="p-6">
            <FieldLensCell period={filters.period} />
          </div>
        </Panel>
      </section>

      {/* ── b2b_283 — proof engine: cost-per-outcome + retire signal ─────── */}
      <section className="space-y-3">
        <SectionHeader title="Proof engine" meta="proof, not promises" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <CostPerOutcomeCell period={filters.period} />
          </div>
          <div className="p-6">
            <RetireSignalCell />
          </div>
        </Panel>
      </section>

      {/* ── Outcomes ledger — did it hold? ────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Outcomes ledger — did it hold?"
          meta={rows.length > 0 ? `${rows.length} metrics · k≥5 both quarters` : undefined}
        />
        {ledger.isLoading ? (
          <PanelSkeleton />
        ) : rows.length === 0 ? (
          <Panel className="px-6 py-10 text-center">
            <p className="text-[13.5px] font-medium text-slate-900">
              The Verify beat begins next quarter
            </p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
              An outcome receipt needs a before and an after — it appears once a second quarter
              is published at k≥5. No movement is estimated until then.
            </p>
          </Panel>
        ) : (
          <OutcomesLedger rows={rows} />
        )}
      </section>

      {/* ── Notes colophon (honest scaffolding) ──────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Intervention attribution links each receipt to the programme booked for that cohort in
            the Act tab — a receipt reads &ldquo;unlinked&rdquo; only when no programme was booked
            for it before the movement.
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Department-level receipts fill in as each cohort clears k≥5 in two consecutive
            quarters.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── Guardrail integrity (WS-O O0/O6, anti-Goodhart) ─────────────────────── */

function GuardrailSection({ period }: { period: string }) {
  const q = useGuardrailViolations(period);
  const data = q.data;
  const status = data?.status ?? "no_org";
  const count = data?.violationCount ?? 0;
  const clean = count === 0;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Guardrail integrity"
        meta={
          status === "computed" && data?.periodPrev && data?.periodCurr
            ? `${data.periodPrev} → ${data.periodCurr}`
            : undefined
        }
      />
      {q.isLoading ? (
        <PanelSkeleton className="h-28" />
      ) : q.isError ? (
        <Panel className="p-6">
          <p className="text-[13px]" style={{ color: SEVERITY.red }}>
            Could not load guardrail checks — refresh to retry.
          </p>
        </Panel>
      ) : status !== "computed" ? (
        <Panel className="p-6">
          <CellTitle state="starting point">Accelerator vs brake pairs</CellTitle>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-400">
            {status === "need_two_snapshots"
              ? "Guardrail checks compare two published quarters — they begin once a second quarter is published."
              : status === "no_snapshot"
                ? "No published snapshot yet — guardrail integrity appears after the first campaign closes."
                : "Pending."}
          </p>
        </Panel>
      ) : (
        <Panel className={clean ? "p-6" : "overflow-hidden"}>
          <div className={clean ? undefined : "p-6 pb-4"}>
            <CellTitle
              state={
                clean ? (
                  <BandDot color={SEVERITY.green} label="no violations" />
                ) : (
                  <BandDot color={SEVERITY.red} label={`${count} needs attention`} />
                )
              }
            >
              Accelerator vs brake pairs
            </CellTitle>
            <p className="mt-2 text-[12.5px] leading-relaxed text-slate-500">
              {clean
                ? "All metric pairs moved honestly — no accelerator improved at the expense of its brake."
                : "Every accelerator metric is checked against its paired brake. A violation = a metric improved while its brake degraded (possible gaming)."}
            </p>
          </div>
          {!clean && (
            <div className="divide-y divide-slate-100 border-t border-slate-100">
              {(data?.violations ?? []).map((v) => (
                <div key={`${v.group}:${v.accelerator}`} className="px-6 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <MicroLabel>{v.group}</MicroLabel>
                    <span className="text-[13px] font-medium" style={{ color: SEVERITY.red }}>
                      {v.accelerator} ↑ vs {v.brake} ↓
                    </span>
                  </div>
                  <p className="mt-1 text-[12px] leading-relaxed text-slate-500">{v.detail}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      )}
    </section>
  );
}

/* ── Channel divergence (KTI, b2b_277) ───────────────────────────────────── */

// channel_divergence_band: identified − anonymous pts, lower=better (channels agree).
function divergenceTone(v: number): string {
  if (v <= 5) return SEVERITY.green;
  if (v <= 15) return SEVERITY.amber;
  return SEVERITY.coral;
}

function ChannelDivergenceCell({ period }: { period: string }) {
  const org = useMetricCells("CHANNEL_DIVERGENCE_INDEX", "ORG", period);
  if (org.isLoading) return <CellSkeleton />;
  if (org.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load channel divergence — refresh to retry.
      </p>
    );

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state={cell && cell.suppressed ? "below threshold · k≥5" : undefined}>
        Channel divergence
      </CellTitle>
      {suppressed || v == null ? (
        <SuppressedNote>
          {cell && cell.suppressed
            ? "Below the reporting threshold — both the battery and the pulse channel need at least 5 responders."
            : "Pending — appears once a quarterly battery and an anonymous pulse both run for the same cohort."}
        </SuppressedNote>
      ) : (
        <div className="flex flex-col gap-1">
          <MicroLabel>Identified − anonymous</MicroLabel>
          <span
            className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
            style={{ color: divergenceTone(v) }}
          >
            {v > 0 ? `+${v}` : v}
            <span className="ml-1 text-[14px] font-normal text-slate-400">pts gap</span>
          </span>
          <span className="text-[12px] leading-4 tabular-nums text-slate-500">
            n={cell!.n} · channels agree at ≤5 pts
          </span>
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Identified battery − anonymous pulse favourability. A large positive gap is a quantified
          trust deficit (reported-high, felt-low). Aggregate only, k≥5.
        </Foot>
      </div>
    </div>
  );
}

/* ── ORDI (WS-G, b2b_291) — observed vs reported psych-safety ────────────── */

function OrdiCell() {
  const { data, isLoading } = useQuery({
    queryKey: ["orgOrdi"],
    queryFn: () => getOrgOrdi(null),
  });

  if (isLoading) return <CellSkeleton />;
  const live = data?.status === "computed";

  if (!live) {
    return (
      <div className="flex h-full flex-col gap-3">
        <CellTitle state={`below threshold · k≥${data?.k ?? 5}`}>
          Observed–reported divergence
        </CellTitle>
        <SuppressedNote k={data?.k} />
      </div>
    );
  }

  const computed = data!.cells.filter((c) => c.status === "computed");
  const pending = data!.cells.filter((c) => c.status !== "computed");
  const worst =
    data!.anyReportedHighObservedLow && data!.worstDivergenceConstruct
      ? computed.find((c) => c.constructCode === data!.worstDivergenceConstruct)
      : null;

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle>Observed–reported divergence</CellTitle>
      <div className="flex items-baseline justify-between gap-4 text-[13px] leading-5">
        <span className="text-slate-600">Reported psychological safety</span>
        <span
          className="shrink-0 font-semibold tabular-nums"
          style={{ color: gradientColor(data!.reported?.value ?? 0, true) }}
        >
          {data!.reported?.value?.toFixed(0)} / 100
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-slate-500">
        vs {data!.reliableSessions} κ≥0.70 reliable observation sessions. Δ = reported − observed
        (positive = says-safer-than-behaves).
      </p>
      <div>
        {computed.map((c) => (
          <div
            key={c.constructCode}
            className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5"
          >
            <span className="min-w-0 truncate text-slate-600">
              {c.constructName}
              {c.reportedHighObservedLow && (
                <span className="ml-2 text-[11px] font-medium" style={{ color: SEVERITY.amber }}>
                  says-safe / behaves-unsafe
                </span>
              )}
            </span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              <span
                title="Observed (0–100)"
                style={{ color: gradientColor(c.observedNorm ?? 0, true) }}
              >
                {c.observedNorm?.toFixed(0)}
              </span>
              <span
                className="font-semibold"
                title="Divergence Δ"
                style={{ color: gradientColor(100 - Math.abs(c.divergenceDelta ?? 0), true) }}
              >
                Δ{(c.divergenceDelta ?? 0) > 0 ? "+" : ""}
                {c.divergenceDelta?.toFixed(0)}
              </span>
            </span>
          </div>
        ))}
        {pending.map((c) => (
          <div
            key={c.constructCode}
            className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5"
          >
            <span className="min-w-0 truncate text-slate-600">{c.constructName}</span>
            <span className="shrink-0 text-slate-400">below threshold</span>
          </div>
        ))}
      </div>
      {worst && (
        <p className="text-[12px] font-medium leading-relaxed" style={{ color: SEVERITY.amber }}>
          Largest gap: {worst.constructName} (Δ+{data!.worstDivergenceDelta?.toFixed(0)}). Surveys
          read safe; observed behaviour does not — a candour gap.
        </p>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Both channels are k≥{data!.k ?? 5} aggregates — never an individual or a named team.
        </Foot>
      </div>
    </div>
  );
}

/* ── FieldLens (WS-U §5, b2b_300) — online-channel trust deltas ──────────── */

const FIELDLENS_LABEL: Record<FieldLensSignal["signal"], string> = {
  anonymity_delta: "Anonymity Delta",
  conformity_delta: "Conformity Delta",
  should_would_gap: "Should-Would Gap",
};

// All three: higher discount = worse (more trust erosion). Calm gradient, never red.
function fieldLensTone(discount: number): string {
  if (discount <= 10) return SEVERITY.green;
  if (discount <= 40) return SEVERITY.amber;
  return SEVERITY.coral;
}

function fieldLensUnit(signal: FieldLensSignal["signal"]): string {
  return signal === "conformity_delta" ? "signals" : "pts gap";
}

function FieldLensCell({ period }: { period: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["orgFieldLens", period],
    queryFn: () => getOrgFieldLens(period),
  });

  if (isLoading) return <CellSkeleton />;
  const signals = data?.signals ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="L3/CHRO lens">FieldLens trust deltas</CellTitle>
      {signals.length === 0 ? (
        <SuppressedNote>
          Pending — appears once the identified battery and anonymous pulse both run for the same
          departments (k≥5) and the trust deltas are switched on after sign-off. Cohort-only; never
          names or flags a person.
        </SuppressedNote>
      ) : (
        <div>
          {signals.map((s, i) => (
            <div
              key={`${s.signal}-${s.departmentId ?? "org"}-${i}`}
              className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5"
            >
              <span className="min-w-0 truncate text-slate-600">
                {FIELDLENS_LABEL[s.signal]}
                {s.mode === "shadow" ? " · shadow" : ""}
              </span>
              <span className="flex shrink-0 items-baseline gap-1.5">
                <span
                  className="font-semibold tabular-nums"
                  style={{ color: fieldLensTone(s.discount) }}
                >
                  {s.value == null ? "—" : s.value > 0 ? `+${s.value}` : s.value}
                </span>
                <span className="text-[11.5px] tabular-nums text-slate-400">
                  {fieldLensUnit(s.signal)} · n={s.n}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          Coercion-adjacent trust signals. Aggregate only, k≥5; a rollout/remediation prompt,
          never individual blame.
        </Foot>
      </div>
    </div>
  );
}

/* ── Proof engine (b2b_283) — cost per outcome + retire signal ───────────── */

// Currency receipts render with the RPC's own currency; default group-by locale.
function fmtMoney(v: number | null, currency: string): string {
  if (v == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${currency} ${Math.round(v).toLocaleString()}`;
  }
}

function CostPerOutcomeCell({ period }: { period: string }) {
  const cost = useOrgCostPerOutcome(period);
  if (cost.isLoading) return <CellSkeleton />;
  if (cost.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load cost per outcome — refresh to retry.
      </p>
    );

  const rows: CostPerOutcomeRow[] = cost.data?.rows ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={cost.data?.privacyK != null ? `k≥${cost.data.privacyK}` : undefined}
      >
        Cost per outcome
      </CellTitle>
      {rows.length === 0 ? (
        <SuppressedNote>
          No booked programmes attributed to a verified outcome this period yet.
        </SuppressedNote>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <CostRow key={r.interventionId ?? `${r.catalogueKey}:${r.grain}`} row={r} />
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          What one verified, reliable improvement actually costs — the programme&apos;s period cost
          divided by its k-safe verified improvements. A receipt reads blank (never an invented
          figure) until both a cost and a reliable outcome exist.
        </Foot>
      </div>
    </div>
  );
}

function CostRow({ row: r }: { row: CostPerOutcomeRow }) {
  const suppressed = r.suppressed || r.costPerOutcome == null;
  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-5 text-slate-900">
            {r.interventionName ?? r.catalogueKey ?? "Programme"}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] leading-4 text-slate-500">
            {r.cohortLabel ?? r.grain} · {r.reliableOutcomes ?? 0} verified ·{" "}
            {r.metricLabel ?? r.targetMetricKey}
          </p>
        </div>
        <div className="shrink-0 text-right">
          {suppressed ? (
            <p className="text-[12.5px] leading-5 text-slate-400">
              {r.suppressed
                ? (r.suppressionReason ?? "below threshold (k)")
                : r.costAmount == null
                  ? "cost not entered yet"
                  : "no verified outcome yet"}
            </p>
          ) : (
            <p
              className="text-[15px] font-semibold leading-5 tabular-nums"
              style={{ color: SEVERITY.green }}
            >
              {fmtMoney(r.costPerOutcome, r.currency)}
              <span className="ml-1 text-[11.5px] font-normal text-slate-400">/ outcome</span>
            </p>
          )}
          {r.ciBasis && (
            <p className="mt-0.5 text-[10.5px] leading-4 text-slate-400">{r.ciBasis}</p>
          )}
        </div>
      </div>
    </div>
  );
}

// retire-signal tone: regressed = red alert; flat/below-floor = calm coral.
function retireTone(direction: string | null): string {
  return direction === "regressed" ? SEVERITY.red : SEVERITY.coral;
}

function RetireSignalCell() {
  const underperf = useOrgUnderperformingInterventions();
  if (underperf.isLoading) return <CellSkeleton />;
  if (underperf.isError)
    return (
      <p className="text-[13px]" style={{ color: SEVERITY.red }}>
        Could not load the retire signal — refresh to retry.
      </p>
    );

  const rows: UnderperformingInterventionRow[] = underperf.data?.rows ?? [];

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={
          underperf.data?.effectFloorPoints != null
            ? `floor ${underperf.data.effectFloorPoints} pt`
            : undefined
        }
      >
        Underperforming interventions
      </CellTitle>
      {rows.length === 0 ? (
        <SuppressedNote>
          No programme is below the retire threshold — every booked play is holding its verified
          effect (or is too early to read). An empty list is the good outcome.
        </SuppressedNote>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <RetireRow key={r.interventionId ?? `${r.catalogueKey}:${r.period}`} row={r} />
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>
          The retire signal — booked programmes whose verified quarter-over-quarter movement
          regressed, was flat, or improved below the effect floor. Each row is a real
          k≥5-on-both-quarters ledger reading.
        </Foot>
      </div>
    </div>
  );
}

function RetireRow({ row: r }: { row: UnderperformingInterventionRow }) {
  const tone = retireTone(r.direction);
  const sign = r.delta != null && r.delta > 0 ? "+" : "";
  return (
    <div className="py-3 first:pt-0">
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium leading-5 text-slate-900">
            {r.metricLabel ?? r.targetMetricKey ?? "Programme"}
          </p>
          <p className="mt-0.5 truncate text-[11.5px] leading-4 text-slate-500">
            {r.status ?? "—"}
            {r.period ? ` · ${r.period}` : ""}
            {r.n != null ? ` · n=${r.n}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-[13px] leading-5 tabular-nums">
            <span className="text-slate-400">{r.beforeValue ?? "—"}</span>
            <span className="mx-1 text-slate-300">→</span>
            <span className="font-medium text-slate-900">{r.afterValue ?? "—"}</span>
            <span className="ml-2 font-semibold" style={{ color: tone }}>
              {r.delta == null ? "—" : `${sign}${r.delta} pts`}
            </span>
          </p>
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{r.direction ?? "—"}</p>
        </div>
      </div>
      {r.signal && <p className="mt-1 text-[11.5px] leading-4 text-slate-400">{r.signal}</p>}
      {r.recommendation && (
        <p className="mt-1 text-[11.5px] font-medium leading-4" style={{ color: tone }}>
          {r.recommendation}
        </p>
      )}
    </div>
  );
}

/* ── Outcomes ledger ─────────────────────────────────────────────────────── */

const LEDGER_COLS =
  "md:grid md:grid-cols-[minmax(0,1.1fr)_150px_80px_minmax(0,1fr)_170px] md:items-center md:gap-4";

const directionTone = (r: VerifyLedgerRow): string => {
  if (r.direction === "flat") return "var(--brand-muted)";
  if (r.direction === "improved") return SEVERITY.green;
  // regressed: red only when the move is a discrete, significant employer alert;
  // otherwise calm coral (never red on a soft/uncertain signal).
  return r.state === "alert" ? SEVERITY.red : SEVERITY.coral;
};

function OutcomesLedger({ rows }: { rows: VerifyLedgerRow[] }) {
  return (
    <Panel className="overflow-hidden">
      <div
        className={cn(
          "hidden border-b border-slate-100 px-6 py-2.5 md:grid",
          LEDGER_COLS.replace("md:grid ", ""),
        )}
      >
        <MicroLabel>Metric</MicroLabel>
        <MicroLabel>
          <span className="block text-right">Before → after</span>
        </MicroLabel>
        <MicroLabel>
          <span className="block text-right">Δ</span>
        </MicroLabel>
        <MicroLabel>Confidence</MicroLabel>
        <MicroLabel>
          <span className="block text-right">Reading</span>
        </MicroLabel>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => (
          <OutcomeRow key={`${r.metricKey}:${r.grain}:${r.grainRef ?? "org"}`} row={r} />
        ))}
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          Each metric&apos;s measured movement from the prior published quarter to this one, with a
          95% confidence interval where the metric is a true rate. Aggregate (k≥5) on both
          quarters; cohorts under 5 in either quarter are omitted. A reading is
          &ldquo;unlinked&rdquo; until a programme is booked for its cohort in the Act tab.
        </Foot>
      </div>
    </Panel>
  );
}

function OutcomeRow({ row: r }: { row: VerifyLedgerRow }) {
  const tone = directionTone(r);
  const sign = r.delta != null && r.delta > 0 ? "+" : "";
  const hasCi = r.ciLower != null && r.ciUpper != null;

  return (
    <div className={cn("flex flex-col gap-2 px-6 py-3.5", LEDGER_COLS)} title={r.insight}>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium leading-5 text-slate-900">
          {r.metricLabel}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] leading-4 text-slate-500">{r.cohortLabel}</p>
      </div>

      <div className="md:text-right">
        <p className="text-[13px] leading-5 tabular-nums">
          <span className="text-slate-400">{r.beforeValue ?? "—"}</span>
          <span className="mx-1 text-slate-300">→</span>
          <span className="font-medium text-slate-900">{r.afterValue ?? "—"}</span>
        </p>
        <p className="mt-0.5 text-[11px] leading-4 tabular-nums text-slate-400">
          {r.beforePeriod} → {r.afterPeriod}
        </p>
      </div>

      <div className="md:text-right">
        <p className="text-[14px] font-semibold leading-5 tabular-nums" style={{ color: tone }}>
          {r.delta == null ? "—" : `${sign}${r.delta}`}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 text-slate-400">pts</p>
      </div>

      <div className="min-w-0">
        <p className="text-[12px] leading-4 tabular-nums text-slate-500">
          {hasCi
            ? `95% CI [${r.ciLower}, ${r.ciUpper}] · ${r.significant ? "excludes 0" : "includes 0"}`
            : "CI pending — variance not captured for this metric type"}
        </p>
        <p className="mt-0.5 text-[11px] leading-4 tabular-nums text-slate-400">n={r.n}</p>
      </div>

      <div className="md:text-right">
        {r.state === "alert" ? (
          <BandDot color={SEVERITY.red} label="needs attention" />
        ) : r.state === "celebration" ? (
          <BandDot color={SEVERITY.green} label="improvement confirmed" />
        ) : r.state === "low_confidence" ? (
          <span className="text-[11.5px] text-slate-400">low confidence — directional</span>
        ) : (
          <span className="text-[11.5px] text-slate-400">
            {r.attribution === "unlinked" ? "unlinked" : r.attribution}
          </span>
        )}
        {r.state !== "live" && r.attribution !== "unlinked" && (
          <p className="mt-0.5 text-[11px] leading-4 text-slate-400">{r.attribution}</p>
        )}
      </div>
    </div>
  );
}
