"use client";

import { cn } from "@/lib/utils";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  CellTitle,
  Foot,
  BandDot,
} from "@/components/ui/panels";
import { SEVERITY } from "@/lib/severity";

/**
 * "How it works" — an in-product explainer for employer users, set in the
 * redesigned visual language (typography-led, near-monochrome slate; navy is
 * the single interactive accent; severity colour only on data). Static content
 * only — no queries, no hooks. Each logical section is a SectionHeader + one
 * borderless Panel whose cells are hairline-divided; repeated homogeneous
 * items (metrics, questions) read as ledgers, not card grids.
 */
export default function GuidePage() {
  return (
    <div className="space-y-8 pb-16">
      <header className="px-1 pt-1">
        <MicroLabel>Guide</MicroLabel>
        <h1 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          How this dashboard works
        </h1>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          A plain-English guide to what you&apos;re looking at, how every number is calculated, when
          data appears, and why it&apos;s built this way.
        </p>
      </header>

      {/* ── The one rule ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="The one rule that governs everything" meta="the Iron Rule" />
        <Panel className="overflow-hidden">
          <p className="border-b border-slate-100 px-6 py-5 text-[13.5px] leading-relaxed text-slate-600">
            You are an <Strong>employer viewer</Strong>. The whole system is built around a single
            promise: you can see <Strong>anonymous group results</Strong>{" "}and{" "}
            <Strong>who has / hasn&apos;t filled in</Strong>{" "}a check-in — but <Strong>never</Strong>{" "}
            any individual&apos;s answers, scores, or risk.
          </p>
          <div className="grid md:grid-cols-2">
            <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
              <CellTitle>You can see</CellTitle>
              <DotList
                items={[
                  "Group averages and trends",
                  "Department / level / team aggregates (k≥5)",
                  "Who completed vs. who hasn't (by name)",
                  "Programme ROI, participation, data confidence",
                ]}
              />
            </div>
            <div className="p-6">
              <CellTitle>You can never see</CellTitle>
              <DotList
                items={[
                  "Any one person's responses or score",
                  "Who is depressed / anxious / at risk",
                  "Crisis events or clinical notes",
                  "Anything for a group smaller than 5",
                ]}
              />
            </div>
          </div>
          <div className="border-t border-slate-100 px-6 py-3.5">
            <Foot>
              This isn&apos;t a policy you have to trust — it&apos;s enforced in the database.
              Individual data physically can&apos;t reach this screen (row-level security denies it;
              aggregates come only through a &ldquo;Privacy Kernel&rdquo; that refuses to return
              anything below 5 people).
            </Foot>
          </div>
        </Panel>
      </section>

      {/* ── When data appears ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="When does data appear?" meta="a measurement cycle, start to finish" />
        <Panel className="overflow-hidden">
          {/* lifecycle rail */}
          <div className="grid border-b border-slate-100 md:grid-cols-5">
            {LIFECYCLE.map((s, i) => (
              <div
                key={s.t}
                className={cn(
                  "flex flex-col gap-1 px-5 py-4",
                  i > 0 && "border-t border-slate-100 md:border-l md:border-t-0",
                )}
              >
                <span className="text-[11px] font-medium tabular-nums text-slate-300">
                  0{i + 1}
                </span>
                <span className="text-[13px] font-semibold leading-5 tracking-[-0.01em] text-slate-900">
                  {s.t}
                </span>
                <span className="text-[12px] leading-snug text-slate-500">{s.d}</span>
              </div>
            ))}
          </div>

          {/* availability conditions */}
          <div className="px-6 py-4">
            <MicroLabel>What shows up only after a condition is met</MicroLabel>
            <div className="mt-2 divide-y divide-slate-100">
              {AVAILABILITY.map((r) => (
                <div
                  key={r.a}
                  className="grid gap-x-6 gap-y-0.5 py-2.5 text-[13px] leading-5 md:grid-cols-[220px_minmax(0,1fr)]"
                >
                  <span className="font-medium text-slate-900">{r.a}</span>
                  <span className="text-slate-500">{r.b}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 px-6 py-4">
            <p className="text-[12.5px] leading-relaxed text-slate-500">
              <Strong>Example.</Strong>{" "}A manager&apos;s <Strong>My Teams</Strong>{" "}view stays blank
              until <Strong>5 people on that team</Strong>{" "}have responded. A 3-person team is shown
              as &ldquo;below reporting threshold&rdquo; — on purpose, so no one can be singled out.
              The same floor applies to every department, level, and team cell across the dashboard.
            </p>
          </div>
        </Panel>
      </section>

      {/* ── Metrics ledger ────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="The metrics, and exactly how each is calculated"
          meta={`${METRICS.length} metrics`}
        />
        <Panel className="overflow-hidden">
          <div className={cn("hidden border-b border-slate-100 px-6 py-2.5 md:grid", METRIC_COLS)}>
            <MicroLabel>Metric</MicroLabel>
            <MicroLabel>What it is · how it&apos;s calculated</MicroLabel>
            <MicroLabel>
              <span className="block text-right">Status</span>
            </MicroLabel>
          </div>
          <div className="divide-y divide-slate-100">
            {METRICS.map((m) => (
              <div key={m.key} className={cn("flex flex-col gap-2 px-6 py-4 md:grid", METRIC_COLS)}>
                <div className="min-w-0">
                  <p className="text-[14px] font-medium leading-5 text-slate-900">{m.name}</p>
                  {m.bands && (
                    <p className="mt-0.5 text-[11.5px] leading-4 text-slate-400">Bands: {m.bands}</p>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[12.5px] leading-relaxed text-slate-500">{m.what}</p>
                  <p className="mt-1 font-mono text-[11.5px] leading-4 text-slate-600">{m.how}</p>
                </div>
                <div className="md:text-right">
                  {m.live ? (
                    <BandDot color={SEVERITY.green} label="live" />
                  ) : (
                    <span className="text-[11.5px] text-slate-400">{m.status}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ── Behind each number ────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Behind each number" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <div className="flex h-full flex-col gap-3">
              <CellTitle>How a single number is built</CellTitle>
              <p className="text-[12.5px] leading-relaxed text-slate-500">
                Every aggregate travels the same path — identity is dropped early and permanently:
              </p>
              <ol className="space-y-2">
                {PIPELINE.map((s, i) => (
                  <li key={i} className="flex gap-3 text-[12.5px] leading-relaxed text-slate-600">
                    <span className="w-4 shrink-0 text-right font-medium tabular-nums text-slate-300">
                      {i + 1}
                    </span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-auto pt-1">
                <Foot>
                  The firewall is structural: after step 3 the data lives in &ldquo;pseudonym
                  space&rdquo; with no link back to a person, so even a bug can&apos;t leak who
                  answered what.
                </Foot>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex h-full flex-col gap-3">
              <CellTitle>Why some numbers say &ldquo;directional&rdquo;</CellTitle>
              <p className="text-[12.5px] leading-relaxed text-slate-500">
                Every snapshot carries a <Strong>Data Confidence Score (DCS)</Strong>{" "}and a{" "}
                <Strong>Response Validity</Strong>{" "}rate — they answer &ldquo;how much should I trust
                this number?&rdquo;
              </p>
              <DotList
                items={[
                  <span key="p">
                    <Strong>Participation</Strong>{" "}— did enough people respond? (target ≥70%)
                  </span>,
                  <span key="v">
                    <Strong>Validity</Strong>{" "}— an automated check (RQI) flags self-contradictory
                    responses (e.g. &ldquo;thriving&rdquo; <i>and</i>{" "}&ldquo;severely
                    depressed&rdquo;); ≥2 flags → excluded from the averages.{" "}
                    <Strong>Safety is never affected</Strong>{" "}— a crisis flag always fires.
                  </span>,
                  <span key="r">
                    <Strong>Representativeness</Strong>{" "}— did responders match the workforce shape?
                  </span>,
                ]}
              />
              <div className="mt-auto pt-1">
                <Foot>
                  When confidence is low the strip dims to &ldquo;directional&rdquo; — it never
                  hides the number, it just says read it as a direction, not a precise figure.
                </Foot>
              </div>
            </div>
          </div>
        </Panel>
      </section>

      {/* ── Screens & privacy ─────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="The screens — and privacy in practice" />
        <Panel className="grid md:grid-cols-2">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <div className="flex h-full flex-col gap-3">
              <CellTitle>What each screen shows</CellTitle>
              <div className="divide-y divide-slate-100">
                {TABS.map((t) => (
                  <div
                    key={t.n}
                    className="grid gap-x-4 gap-y-0.5 py-2 text-[12.5px] leading-5 sm:grid-cols-[130px_minmax(0,1fr)]"
                  >
                    <span className="font-medium text-slate-900">{t.n}</span>
                    <span className="text-slate-500">{t.d}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex h-full flex-col gap-3">
              <CellTitle>Privacy &amp; safety, in practice</CellTitle>
              <DotList
                items={[
                  <span key="c">
                    <Strong>Consent is per-purpose</Strong>{" "}— each person separately agrees to (or
                    declines) each use of their data, and can change it any time. Only consenting
                    people are counted.
                  </span>,
                  <span key="x">
                    <Strong>Crisis is handled privately, by humans</Strong>{" "}— if an answer signals
                    risk, a clinician is alerted instantly. You are <Strong>never</Strong>{" "}told; it
                    can&apos;t be inferred from any aggregate.
                  </span>,
                  <span key="e">
                    <Strong>Erasure</Strong>{" "}— if someone leaves or asks to be erased, their data
                    drops out of all future aggregates automatically.
                  </span>,
                  <span key="r">
                    <Strong>One re-identification path</Strong>{" "}— the only place a name is
                    reconnected to data is a service-role clinical job for crisis outreach. It never
                    touches your screen.
                  </span>,
                ]}
              />
            </div>
          </div>
        </Panel>
      </section>

      {/* ── Why it's built this way ───────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Why it's built this way" meta="the advantage" />
        <Panel className="grid md:grid-cols-3">
          {ADVANTAGES.map((a, i) => (
            <div
              key={a.t}
              className={cn(
                "p-6",
                i < ADVANTAGES.length - 1 && "border-b border-slate-100",
                i < 3 && "md:border-b",
                i >= 3 && "md:border-b-0",
                i % 3 !== 2 && "md:border-r md:border-slate-100",
              )}
            >
              <p className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">{a.t}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500">{a.d}</p>
            </div>
          ))}
        </Panel>
      </section>

      {/* ── Common questions ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <SectionHeader title="Common questions" meta={`${FAQ.length} questions`} />
        <Panel className="overflow-hidden">
          <div className="divide-y divide-slate-100">
            {FAQ.map((f) => (
              <div key={f.q} className="px-6 py-4">
                <p className="text-[13.5px] font-medium leading-5 text-slate-900">{f.q}</p>
                <p className="mt-1 max-w-3xl text-[12.5px] leading-relaxed text-slate-500">{f.a}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* ── Notes colophon ────────────────────────────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <Strong>Everything here is aggregate.</Strong>{" "}The dashboard renders only frozen, k≥5
            cells delivered through the Privacy Kernel — never a live individual record.
          </li>
          <li>
            <Strong>Pending is deliberate.</Strong>{" "}OWI and BRI stay &ldquo;pending&rdquo; until
            their weightings and thresholds are clinically signed off — a blank beats a number no
            one has agreed to.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── content ──────────────────────────────────────────────────────────────── */

const LIFECYCLE = [
  { t: "Scheduled", d: "HR sets a window + reminder cadence." },
  { t: "Opens", d: "Everyone eligible is assigned the check-in." },
  { t: "People respond", d: "Private answers; non-responders nudged." },
  { t: "Closes & freezes", d: "An immutable anonymised snapshot is computed." },
  { t: "You see it", d: "k≥5 aggregates appear, stamped + confidence-scored." },
];

const AVAILABILITY = [
  { a: "Any metric at all", b: "a campaign has closed and a snapshot is frozen (nothing shows mid-campaign)." },
  { a: "A department / team / level cell", b: "at least 5 people in that group responded (else “below reporting threshold”)." },
  { a: "My Teams (for a manager)", b: "the manager’s own team reaches 5+ respondents." },
  { a: "Trends (quarter-over-quarter)", b: "at least 2 quarters have been published." },
  { a: "ROI", b: "a baseline + a current snapshot exist (it compares the two)." },
  { a: "Cross-org benchmarks", b: "8+ organisations are in the peer set (not yet — single-org pilot)." },
  { a: "OWI (headline index)", b: "its weighting is clinically signed off — currently shown as “pending” by design." },
];

const METRIC_COLS = "md:grid-cols-[240px_minmax(0,1fr)_120px] md:items-baseline md:gap-6";

const METRICS = [
  { key: "part", name: "Participation %", live: true, what: "Share of assigned people who completed the check-in.", how: "completed ÷ assigned × 100", bands: "target ≥70%" },
  { key: "owi", name: "OWI — Wellbeing Index", live: false, status: "pending sign-off", what: "Headline 0–100 wellbeing index blending several instruments.", how: "weighted( WHO-5(+), PSS-10(−), OLBI(−) ) → 0–100", bands: "Green ≥70 · Amber 55–69 · Coral <55 (hidden until ratified)" },
  { key: "vdi", name: "VDI — Vulnerability Distribution", live: true, what: "What share of a group sits in each clinical band — the shape, not any person.", how: "% per band from worst of PHQ-9 / GAD-7; bands <5 suppressed", bands: "Low · Moderate · High · Critical" },
  { key: "validity", name: "Response Validity %", live: true, what: "Share of responses that passed the automated quality check (RQI).", how: "valid ÷ total × 100  (≥2 contradiction flags ⇒ excluded)", bands: "target ≥90%" },
  { key: "tq", name: "Trust Quotient", live: true, what: "A 0–100 read on how trustworthy the signal is.", how: "participation × validity × (1−divergence) × trust-item × 100" },
  { key: "dcs", name: "DCS — Data Confidence", live: true, what: "One number for ‘how much to trust this snapshot’.", how: "geomean( participation, validity, representativeness )" },
  { key: "roi", name: "Programme ROI", live: true, what: "Estimated return, from self-reported WPAI-GH data.", how: "(presenteeism + absence + attrition savings) ÷ programme cost", bands: "labelled ‘self-reported’; HRMS-verified is an optional upgrade" },
  { key: "bri", name: "BRI — Burnout Risk", live: false, status: "data-gated", what: "Burnout level from the OLBI instrument.", how: "OLBI exhaustion + disengagement composite", bands: "thresholds set after the first full wave of data" },
];

const PIPELINE = [
  "A person answers the battery in their own app (gateways branch — the longer depression questions only appear if the 2-item screen is positive).",
  "The engine scores each instrument (reverse-scoring, subscales, clinical severity bands).",
  "The result is projected into pseudonym space — the link to the person is dropped here. From now on it’s an anonymous member token.",
  "The quality engine (RQI) flags self-contradictory sessions so they don’t pollute the averages.",
  "Everything is aggregated into group cells; any cell under 5 people is suppressed (plus ‘complementary’ suppression so a hidden cell can’t be inferred by subtraction).",
  "The snapshot is frozen (immutable) and stamped with a Data Confidence Score.",
  "Only those frozen, k≥5 cells reach this dashboard — through a permission-checked Privacy Kernel.",
];

const TABS = [
  { n: "Overview", d: "Headline wellbeing (OWI), by level, stress mix, coverage, roadmap, and trends." },
  { n: "Health & Risk", d: "Vulnerability distribution + a department heatmap (participation / validity / trust)." },
  { n: "Engagement", d: "Participation by department and level vs. the 70% target." },
  { n: "Impact", d: "Programme ROI (self-reported) and outcome highlights." },
  { n: "Participation", d: "The named roster: who completed vs. who hasn’t — status only." },
  { n: "My Teams", d: "For managers: their own team’s direction + one finding + one play. k≥5." },
  { n: "Confidence strip", d: "Always on top: DCS · Validity · Trust." },
  { n: "Org Health Report", d: "A one-click printable PDF summary (aggregate only)." },
];

const ADVANTAGES = [
  { t: "Honest answers → real signal", d: "Because the employer can never see individual data, people answer honestly. Privacy is what makes the aggregate trustworthy." },
  { t: "Privacy by construction", d: "Not a promise to keep — individual data is structurally blocked from this screen by the database itself." },
  { t: "Confidence on every number", d: "You always know how much to trust a figure (DCS / validity), so you never over-react to a thin or noisy reading." },
  { t: "Safety without surveillance", d: "Risk is caught and handled by clinicians instantly and privately — a healthier workforce without monitoring anyone." },
  { t: "Managers coach, not police", d: "Team views are directional (a band + one play), at k≥5 — useful for action, impossible to use against a person." },
  { t: "Measurable ROI", d: "Wellbeing is tied to presenteeism, absence and attrition, so the programme’s value is quantified." },
];

const FAQ = [
  { q: "Why is OWI blank / ‘pending’?", a: "The headline index’s weighting is being clinically signed off. It’s computed internally but deliberately not shown until ratified — we don’t publish a number no one has agreed to." },
  { q: "Why does a department show ‘below reporting threshold’?", a: "Fewer than 5 people in it responded. Showing it could identify someone, so it’s suppressed until the group is large enough." },
  { q: "Why did Validity drop this quarter?", a: "The automated quality check (RQI) is now live and excluding self-contradictory responses. A lower, real number beats an inflated one." },
  { q: "Why can’t I see who is struggling?", a: "By design. Individual wellbeing and risk are never employer-visible. If someone is at risk, a clinician — not you — is alerted, privately." },
  { q: "When will my team show up?", a: "Once at least 5 of your team complete the current check-in. Until then it stays below threshold." },
  { q: "Can I trust a ‘directional’ number?", a: "Read it as a direction, not a precise figure. Low confidence usually means thin participation or low validity — push participation up and it sharpens." },
];

/* ── presentational helpers ───────────────────────────────────────────────── */

function Strong({ children }: { children: React.ReactNode }) {
  return <span className="font-medium text-slate-700">{children}</span>;
}

function DotList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-2 space-y-1.5">
      {items.map((x, i) => (
        <li key={i} className="flex items-start gap-2 text-[12.5px] leading-relaxed text-slate-600">
          <span aria-hidden className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-slate-300" />
          <span className="min-w-0">{x}</span>
        </li>
      ))}
    </ul>
  );
}
