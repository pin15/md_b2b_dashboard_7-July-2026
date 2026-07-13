"use client";

import { cn } from "@/lib/utils";
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
  useOrgEsgDisclosure,
  useOrgCertification,
  useOrgCommitteeTracker,
  useOrgPrivacyKri,
  useClinicalQuality,
  useOrgBrandingProfile,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { HintTip } from "@/components/ui/HintTip";
import { GLOSSARY } from "@/lib/glossary";
import { Gate } from "@/lib/hooks/useCapabilities";
import type {
  DashboardFilters,
  EsgDisclosureLine,
  CertificationCriterion,
  CommitteeTrackerRow,
  PrivacyKri,
  InterventionStatus,
} from "@/lib/graphql/types";

/**
 * GOVERN / REPORTS tab (doc 04 §6 / the GDAV "Govern" beat) — the board-room
 * accountability surfaces over the published Privacy-Kernel metrics:
 *   • KCI clinical scorecard (WS-O O4, clinical_board forum).
 *   • ESG disclosure map (BRSR Principle-3 → published k-safe values).
 *   • Certification rubric (advisory Silver/Gold; authority pending D12).
 *   • Committee tracker (the ACT board + action-closure-rate KPI).
 *   • Data & Privacy (never-list · rule-of-five · suppression-violation KRI).
 *   • Brand & white-label (b2b_282 — read-only settings surface).
 *
 * Honest-or-pending throughout: every value is a published k-safe number, an honest
 * 'suppressed'/'pending', or — for the privacy KRI — an honest 'pending' until WS-J's
 * audit log lands. Never a fabricated number. Aggregate-only; no individual appears.
 *
 * Visual language (matches the redesigned Act/Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent. Severity
 * colour appears only on data (numerals, band dots) — never as chrome. Red is
 * reserved for discrete threshold alerts (clinical target miss, KRI breach).
 */

export function GovernTab({ filters }: { filters: DashboardFilters }) {
  const esg = useOrgEsgDisclosure(filters.period);
  const cert = useOrgCertification(filters.period);
  const committee = useOrgCommitteeTracker();
  const kri = useOrgPrivacyKri();

  const committeeRows = committee.data ?? [];
  const committeeKpi = committeeRows.find((r) => r.catalogueKey === "_KPI");

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Reports &amp; govern</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Accountability over the published metrics
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          External-facing disclosure, certification, committee action, and the data-privacy KRI —
          all built only from values already published at k≥5. Nothing here is estimated: a line
          is published, suppressed, or pending.
        </p>
      </header>

      {/* ── Clinical quality (WS-O O4 — KCI scorecard) ───────────────────── */}
      <Gate cap="module:care">
        <section className="space-y-3">
          <ClinicalQualitySection period={filters.period} />
        </section>
      </Gate>

      {/* ── Disclosure & certification ──────────────────────────────────── */}
      <Gate cap="module:esg">
        <section className="space-y-3">
          <SectionHeader title="Disclosure & certification" meta={filters.period} />
          <Panel className="grid lg:grid-cols-2">
            <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
              <EsgCell rows={esg.data ?? []} loading={esg.isLoading} period={filters.period} />
            </div>
            <div className="p-6">
              <CertificationCell rows={cert.data ?? []} loading={cert.isLoading} />
            </div>
          </Panel>
        </section>
      </Gate>

      {/* ── Committee tracker ───────────────────────────────────────────── */}
      <Gate cap="module:esg">
        <section className="space-y-3">
          <SectionHeader
            title="Committee tracker"
            meta={
              committeeKpi
                ? `closure ${committeeKpi.closureRate == null ? "—" : `${committeeKpi.closureRate}%`} · ${committeeKpi.closedCount ?? 0}/${committeeKpi.totalCount ?? 0} tracked`
                : undefined
            }
          />
          {committee.isLoading ? (
            <PanelSkeleton />
          ) : (
            <CommitteeLedger rows={committeeRows.filter((r) => r.catalogueKey !== "_KPI")} />
          )}
        </section>
      </Gate>

      {/* ── Data & privacy ──────────────────────────────────────────────── */}
      <Gate cap="module:privacy">
        <section className="space-y-3">
          <SectionHeader title="Data & privacy" meta="never-list · rule of five · suppression KRI" />
          {kri.isLoading || !kri.data ? <PanelSkeleton /> : <PrivacyPanel kri={kri.data} />}
        </section>
      </Gate>

      {/* ── Brand & white-label (b2b_282) — a settings surface, kept apart
             from the accountability sections above. ─────────────────────── */}
      <Gate cap="module:brand">
        <section className="space-y-3">
          <SectionHeader title="Brand & white-label" meta="managed in admin · read-only here" />
          <BrandPanel />
        </section>
      </Gate>

      {/* ── Notes colophon (honest scaffolding) ─────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            ESG framework scope (BRSR Principle-3 vs broader GRI) is a pending decision (D12) —
            every disclosure row is flagged provisional.
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            Certification rubric authority is pending (D12 / the H63 owner) — scoring is advisory,
            never a binding certificate.
          </li>
          <li>
            <span className="font-medium text-slate-700">Pending.</span>{" "}
            The Data &amp; Privacy suppression-violation KRI is honestly &apos;pending&apos; until
            the Privacy-Kernel query log (WS-J) lands — never a fabricated zero.
          </li>
        </ul>
      </footer>
    </div>
  );
}

/* ── Clinical quality (KCI scorecard) ────────────────────────────────────────
 * WS-O O4 (doc 10 §2.3 / clinical_board forum). The CEO care-OUTCOME view:
 * recovery (reliable improvement), care-track completion, and episode lifecycle,
 * from get_clinical_quality. AGGREGATE-only (k≥5 enforced in-DB on the
 * member-with-follow-up denominator). Honest-or-pending: 'no_org'/no-data →
 * pending; 'suppressed' → the dignity note; 'computed' → the numbers. A clinical
 * target MISS is a discrete employer alert, so red is permitted on the value
 * (doc 10 §2.1). */

const KCI_TARGETS = { recovery: 50, completion: 60 } as const;

function ClinicalQualitySection({ period }: { period: string }) {
  const q = useClinicalQuality(period);
  const data = q.data;

  if (q.isLoading)
    return (
      <>
        <SectionHeader
          title="Clinical quality"
          meta={
            <HintTip tip={GLOSSARY.KCI} placement="bottom">
              KCI scorecard
            </HintTip>
          }
        />
        <PanelSkeleton />
      </>
    );
  if (q.isError)
    return (
      <>
        <SectionHeader
          title="Clinical quality"
          meta={
            <HintTip tip={GLOSSARY.KCI} placement="bottom">
              KCI scorecard
            </HintTip>
          }
        />
        <Panel className="px-6 py-8">
          <p className="text-[13px]" style={{ color: SEVERITY.red }}>
            Could not load the clinical scorecard — refresh to retry.
          </p>
        </Panel>
      </>
    );

  const status = data?.status ?? "no_org";
  const computed = status === "computed";

  if (!computed) {
    return (
      <>
        <SectionHeader
          title="Clinical quality"
          meta={status === "suppressed" ? `below threshold · k≥${data?.k ?? 5}` : "pending"}
        />
        <Panel className="px-6 py-10 text-center">
          <p className="text-[13.5px] font-medium text-slate-900">
            {status === "suppressed" ? "Below the reporting threshold" : "No care outcomes yet"}
          </p>
          <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
            {status === "suppressed"
              ? `This lights up once at least ${data?.k ?? 5} members have a follow-up measure — care outcomes are aggregate-only, never an individual.`
              : "Care-outcome quality appears once members enter care and a follow-up measure is taken (governed clinical metric — clinical sign-off required to publish)."}
          </p>
        </Panel>
      </>
    );
  }

  const recoveryMiss =
    data!.reliableImprovementRate != null && data!.reliableImprovementRate < KCI_TARGETS.recovery;
  const completionMiss =
    data!.careTrackCompletionRate != null && data!.careTrackCompletionRate < KCI_TARGETS.completion;

  return (
    <>
      <SectionHeader
        title="Clinical quality"
        meta={
          <>
            <HintTip tip={GLOSSARY.KCI} placement="bottom">
              KCI scorecard
            </HintTip>
            {` · n=${data!.membersWithFollowup} members in care · k≥${data!.k ?? 5}`}
          </>
        }
      />
      <Panel className="overflow-hidden">
        <div className="grid md:grid-cols-3">
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <KciMetric
              label="Recovery rate"
              value={data!.reliableImprovementRate}
              miss={recoveryMiss}
              target={KCI_TARGETS.recovery}
              hint="reliable improvement"
            />
          </div>
          <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
            <KciMetric
              label="Care-track completion"
              value={data!.careTrackCompletionRate}
              miss={completionMiss}
              target={KCI_TARGETS.completion}
              hint={`${data!.careTrackCompleted ?? 0}/${data!.careTrackEnrolmentsTotal ?? 0} enrolments`}
            />
          </div>
          <div className="p-6">
            <KciMetric
              label="Deterioration flag"
              value={data!.deteriorationFlagRate}
              hint="watch metric — no target set"
            />
          </div>
        </div>

        {/* episode lifecycle rail */}
        <div className="grid grid-cols-3 border-t border-slate-100">
          {(
            [
              ["Episodes", data!.episodesTotal],
              ["In care", data!.episodesActive],
              ["Discharged", data!.episodesDischarged],
            ] as const
          ).map(([label, value], i) => (
            <div
              key={label}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-3.5",
                i > 0 && "border-l border-slate-100",
              )}
            >
              <span className="text-[17px] font-semibold leading-6 tabular-nums text-slate-900">
                {value ?? "—"}
              </span>
              <MicroLabel>{label}</MicroLabel>
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 px-6 py-3.5">
          <Foot>
            Source: governed clinical metrics (recovery ≥{KCI_TARGETS.recovery}% · completion ≥
            {KCI_TARGETS.completion}%). Aggregate-only; clinical sign-off gates publication.
          </Foot>
        </div>
      </Panel>
    </>
  );
}

function KciMetric({
  label,
  value,
  miss,
  target,
  hint,
}: {
  label: string;
  value: number | null;
  miss?: boolean;
  target?: number;
  hint?: string;
}) {
  return (
    <div className="flex h-full flex-col gap-1">
      <MicroLabel>{label}</MicroLabel>
      <span
        className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums"
        style={{ color: miss ? SEVERITY.red : undefined }}
      >
        <span className={cn(!miss && (value == null ? "text-slate-300" : "text-slate-900"))}>
          {value == null ? "—" : `${value}%`}
        </span>
      </span>
      {miss && target != null ? (
        <BandDot color={SEVERITY.red} label={`below ≥${target}% target`} />
      ) : target != null ? (
        <span className="text-[12px] leading-4 text-slate-500">target ≥{target}%</span>
      ) : null}
      {hint && <span className="text-[12px] leading-4 text-slate-500">{hint}</span>}
    </div>
  );
}

/* ── ESG disclosure map ──────────────────────────────────────────────────── */

function EsgCell({
  rows,
  loading,
  period,
}: {
  rows: EsgDisclosureLine[];
  loading: boolean;
  period: string;
}) {
  if (loading) return <CellSkeleton />;
  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle state="BRSR Principle-3">ESG disclosure</CellTitle>
      {rows.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          No disclosure lines yet — they appear once Principle-3 metrics publish at k≥5.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {rows.map((r) => (
            <div key={r.lineCode} className="flex items-baseline justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <MicroLabel>{r.lineCode}</MicroLabel>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{r.lineLabel}</p>
              </div>
              {r.status === "published" ? (
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-slate-900">
                  {r.value}
                  {r.unit === "pct" ? "%" : ""}
                </span>
              ) : (
                <span className="shrink-0 text-[12.5px] text-slate-400">
                  {r.status === "suppressed" ? "below threshold" : "pending"}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>BRSR Principle 3 (provisional — scope pending D12) · {period}</Foot>
      </div>
    </div>
  );
}

/* ── Certification rubric ────────────────────────────────────────────────── */

const CRITERION_TONE: Record<string, string> = {
  met: SEVERITY.green,
  unmet: SEVERITY.coral,
};

function CertificationCell({
  rows,
  loading,
}: {
  rows: CertificationCriterion[];
  loading: boolean;
}) {
  if (loading) return <CellSkeleton />;

  const header = rows.find((r) => r.criterionCode === "_TIER");
  const criteria = rows.filter((r) => r.criterionCode !== "_TIER");
  const tier = header?.status ?? "pending";

  return (
    <div className="flex h-full flex-col gap-3">
      <CellTitle
        state={
          rows.length > 0
            ? `advisory · ${tier === "none" ? "not yet certified" : tier}`
            : undefined
        }
      >
        Certification
      </CellTitle>
      {criteria.length === 0 ? (
        <p className="text-[13px] leading-relaxed text-slate-400">
          Rubric scores once participation, validity and trust publish at k≥5.
        </p>
      ) : (
        <div className="divide-y divide-slate-100">
          {criteria.map((c) => (
            <div key={c.criterionCode} className="flex items-baseline justify-between gap-4 py-2.5">
              <div className="min-w-0">
                <MicroLabel>{c.tier}</MicroLabel>
                <p className="mt-0.5 text-[13px] leading-5 text-slate-600">{c.criterionLabel}</p>
              </div>
              <div className="shrink-0 text-right">
                {c.status === "met" || c.status === "unmet" ? (
                  <BandDot color={CRITERION_TONE[c.status]} label={c.status} />
                ) : (
                  <span className="text-[12.5px] text-slate-400">
                    {c.status === "suppressed" ? "below threshold" : "pending"}
                  </span>
                )}
                {c.status === "unmet" && c.gap != null && (
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-slate-400">{c.gap} to go</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-auto pt-1">
        <Foot>Read-only scoring · rubric authority pending (D12).</Foot>
      </div>
    </div>
  );
}

/* ── Committee tracker ───────────────────────────────────────────────────── */

// Same lifecycle rail the Act tab's pipeline uses — booked-or-beyond counts as
// closed for the KPI in the section header.
const COMMITTEE_STAGES: { id: InterventionStatus; label: string }[] = [
  { id: "recommended", label: "Recommended" },
  { id: "committee_review", label: "Review" },
  { id: "booked", label: "Booked" },
  { id: "active", label: "Active" },
  { id: "measuring", label: "Measuring" },
  { id: "retired", label: "Retired" },
];

function CommitteeLedger({ rows }: { rows: CommitteeTrackerRow[] }) {
  if (rows.length === 0) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="text-[13.5px] font-medium text-slate-900">
          No programmes on the committee board yet
        </p>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
          Book one in Act &amp; Programmes and it lands here with its lifecycle stage and the
          closure-rate KPI.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="hidden grid-cols-[minmax(0,1fr)_200px] items-center gap-4 border-b border-slate-100 px-6 py-2.5 md:grid">
        <MicroLabel>Programme</MicroLabel>
        <MicroLabel>
          <span className="block text-right">Stage</span>
        </MicroLabel>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((r) => {
          const stageIdx = COMMITTEE_STAGES.findIndex((s) => s.id === r.status);
          return (
            <div
              key={r.interventionId ?? r.name}
              className="flex flex-col gap-3 px-6 py-4 md:grid md:grid-cols-[minmax(0,1fr)_200px] md:items-center md:gap-4"
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
                {stageIdx >= 0 && (
                  <span className="flex items-center gap-1" aria-hidden>
                    {COMMITTEE_STAGES.map((s, i) => (
                      <span
                        key={s.id}
                        className={cn(
                          "h-[5px] w-[5px] rounded-full",
                          i <= stageIdx ? "bg-[#1E3A5F]" : "bg-slate-200",
                        )}
                      />
                    ))}
                  </span>
                )}
                <span className="text-[12px] font-medium text-slate-500">
                  {COMMITTEE_STAGES[stageIdx]?.label ?? r.status ?? "—"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>Action-closure rate = booked-or-beyond ÷ total tracked.</Foot>
      </div>
    </Panel>
  );
}

/* ── Data & privacy ──────────────────────────────────────────────────────── */

function PrivacyPanel({ kri }: { kri: PrivacyKri }) {
  const pending = kri.status === "pending";
  const breach = kri.status === "breach";

  return (
    <Panel className="overflow-hidden">
      <div className="grid md:grid-cols-3">
        <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
          <div className="flex h-full flex-col gap-1">
            <MicroLabel>Suppression violations</MicroLabel>
            <span
              className={cn(
                "text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums",
                pending ? "text-slate-300" : !breach && "text-slate-900",
              )}
              style={breach ? { color: SEVERITY.red } : undefined}
            >
              {pending ? "—" : kri.suppressionViolations}
            </span>
            {pending ? (
              <span className="text-[12px] leading-4 text-slate-500">
                pending — awaits the Privacy-Kernel query log (WS-J)
              </span>
            ) : (
              <BandDot
                color={breach ? SEVERITY.red : SEVERITY.green}
                label={breach ? "breach — must be 0" : "no violations"}
              />
            )}
            <div className="mt-auto pt-1">
              <Foot>Published cells that would have broken the k floor. Must be 0.</Foot>
            </div>
          </div>
        </div>
        <div className="border-b border-slate-100 p-6 md:border-b-0 md:border-r">
          <div className="flex h-full flex-col gap-1">
            <MicroStat label="Rule of five" value={`k ≥ ${kri.privacyK}`} />
            <div className="mt-auto pt-1">
              <Foot>
                No aggregate is shown for any cohort smaller than {kri.privacyK} people —
                enforced in the Privacy Kernel, not in the UI.
              </Foot>
            </div>
          </div>
        </div>
        <div className="p-6">
          <div className="flex h-full flex-col gap-1">
            <MicroLabel>Never-list</MicroLabel>
            <p className="mt-0.5 text-[13px] leading-relaxed text-slate-600">
              {kri.neverListNote}
            </p>
          </div>
        </div>
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        {breach ? (
          <p className="text-[12px] font-medium leading-4" style={{ color: SEVERITY.red }}>
            {kri.detail}
          </p>
        ) : (
          <Foot>{kri.detail}</Foot>
        )}
      </div>
    </Panel>
  );
}

/* ── Brand & white-label (b2b_282) ───────────────────────────────────────────
 * Surfaces the org's stored branding profile (public.get_org_branding via the
 * orgBrandingProfile query): display name, logo preview, and the primary/accent
 * colour swatches — the swatches are data, so their colour is sanctioned. When
 * nothing is configured it shows an honest empty state pointing the org admin to
 * the admin portal — never a fabricated brand. Read-only here. */

function brandConfigured(b: {
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}): boolean {
  return !!(b.displayName || b.logoUrl || b.primaryColor || b.accentColor);
}

function fmtUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function BrandPanel() {
  const { data, isLoading } = useOrgBrandingProfile();
  if (isLoading) return <PanelSkeleton className="h-28" />;

  const configured = data ? brandConfigured(data) : false;
  const updated = fmtUpdated(data?.updatedAt ?? null);

  if (!data || !configured) {
    return (
      <Panel className="px-6 py-10 text-center">
        <p className="text-[13.5px] font-medium text-slate-900">Not yet configured</p>
        <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
          Set your organisation&apos;s display name, logo and brand colours in the admin portal.
          Once saved they appear here and can drive the dashboard&apos;s white-label chrome.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="overflow-hidden">
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3.5">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.logoUrl}
              alt={`${data.displayName ?? "Organisation"} logo`}
              className="h-11 w-11 rounded-lg bg-slate-50 object-contain p-1"
            />
          ) : (
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-[10px] text-slate-400">
              no logo
            </div>
          )}
          <div className="flex flex-col gap-0.5">
            <span className="text-[15px] font-medium tracking-[-0.01em] text-slate-900">
              {data.displayName ?? "—"}
            </span>
            <MicroLabel>Display name</MicroLabel>
          </div>
        </div>
        <div className="flex gap-8">
          <BrandSwatch label="Primary" value={data.primaryColor} />
          <BrandSwatch label="Accent" value={data.accentColor} />
        </div>
      </div>
      <div className="border-t border-slate-100 px-6 py-3.5">
        <Foot>
          White-label profile — managed in admin.
          {updated ? ` Last updated ${updated}.` : ""}
        </Foot>
      </div>
    </Panel>
  );
}

function BrandSwatch({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2.5">
      {value ? (
        <span
          aria-hidden
          className="h-8 w-8 shrink-0 rounded-md ring-1 ring-black/10"
          style={{ backgroundColor: value }}
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[9px] text-slate-400">
          unset
        </span>
      )}
      <div className="flex flex-col gap-0.5">
        <MicroLabel>{label}</MicroLabel>
        <span className="font-mono text-[12px] tabular-nums text-slate-900">{value ?? "—"}</span>
      </div>
    </div>
  );
}
