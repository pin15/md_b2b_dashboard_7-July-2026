/**
 * Hand-authored types mirroring the employer GraphQL schema (doc 13 P0-1/P0-2).
 *
 * The schema has TWO DISJOINT ISLANDS and NO type path from either to an
 * individual's responses/scores/risk:
 *   1. Aggregate insight  — MetricCell, Overview/HealthRisk/Engagement/Impact,
 *      Heatmap, Funnel, QbrPayload. Numbers only, k≥5, suppression baked in.
 *   2. Named participation — ParticipationRow. Identity + filled/not-filled only.
 *
 * There is intentionally NO `score`, `response`, `answer`, `risk`, `phq*`,
 * `gad*`, `bfi*` field anywhere below. Keep it that way (P0-2 CI test enforces it).
 *
 * TODO(V-3): replace with codegen output from packages/graphql once published.
 */

/** The ONLY slices that exist — fixed, pre-materialised grains (no free-form filters). */
export type Grain = "ORG" | "DEPARTMENT" | "TEAM" | "LEVEL";

export type MetricKey =
  | "OWI"
  | "OBI"
  | "VDI"
  | "WHO5"
  | "PSS_HIGH_PCT"
  | "BURNOUT_RISK_PCT"
  | "BRI" // Burnout Risk Index — org-grain trend feeding the Burnout Journey card (b2b_340-era enum add)
  | "PARTICIPATION_PCT"
  | "RESPONSE_VALIDITY_RATE"
  | "TRUST_QUOTIENT"
  | "THERAPY_UTILIZATION_PCT"
  | "MHSF"
  | "RESILIENCE_BRS"
  // WS-O dynamic metrics served by the generic metricCells (b2b_115/116/120):
  | "MANAGER_CALIBRATION"
  | "HELP_SEEKING_LATENCY"
  | "HELP_SEEKING_CONVERSION"
  | "HEALTHY_STEP_DOWN_RATE"
  // Channel Divergence + Sleep Index (b2b_277) and the dynamic tier (b2b_278: O1/O5):
  | "CHANNEL_DIVERGENCE_INDEX"
  | "SLEEP_INDEX"
  | "RECOVERY_HALF_LIFE"
  | "PULSE_VOLATILITY"
  | "MOODCAST"
  | "MANAGER_CERT_GAP"
  // WS-O KCI cells (b2b_117) — also readable as cells, though the rich scorecard
  // uses the clinicalQuality query:
  | "KCI_TTFS_SLA_PCT"
  | "KCI_RECOVERY_RATE"
  | "KCI_EPISODE_COMPLETION_PCT"
  | "KCI_CRISIS_SLA_PCT"
  // Published employer metrics surfaced as org-grain cells (already is_active; client-wired):
  | "UWES" // work engagement (UWES-9); needed apps/api enum add + gateway rebuild
  | "DECISION_RATE"
  | "OPT_OUT_TREND"
  | "PRESENTEEISM_COST";

/** Manager 360 (own report only) — self-vs-rater gap per domain, ≥4-rater floor. */
export interface Manager360Domain {
  domain: string;
  selfMean: number | null;
  raterMean: number | null;
  raterMin: number | null;
  raterMax: number | null;
  nRaters: number | null;
  gap: number | null;
}
export interface Manager360 {
  status: string; // 'ok' | 'suppressed' | 'no_review'
  suppressed: boolean;
  mode: string;
  minRaters: number;
  completedRaters: number;
  selfOverall: number | null;
  raterOverall: number | null;
  overallGap: number | null;
  interpretation: string | null;
  reason: string | null;
  domains: Manager360Domain[];
}

/** VDI clinical distribution bands (doc 05 §4.1) — worst of PHQ-9/GAD-7. */
export type VdiBand = "low" | "moderate" | "high" | "critical";

/** Programme ROI (doc 11). Aggregate-only; k≥5; self-reported WPAI-GH. */
export interface RoiTerm {
  label: string;
  delta: number | null;
  savings: number | null;
}
export interface OrgRoi {
  label: string;
  roiMultiple: number | null;
  presenteeism: RoiTerm;
  absence: RoiTerm;
  attrition: RoiTerm;
  lowConfidence: boolean;
}

/** Quarter-over-quarter trend point (org-grain, k≥5, suppression-aware). */
export interface TrendPoint {
  period: string;
  value: number | null;
  n: number;
  suppressed: boolean;
}

/** L2 "My Teams" (doc 06 §1.4) — own team only, k≥5, directional (band not value). */
export interface TeamHome {
  status: "ok" | "suppressed" | "no_team";
  team: string | null;
  n: number;
  participationPct: number | null;
  wellbeingBand: "green" | "amber" | "coral" | null;
  validityPct: number | null;
  finding: string | null;
  play: string | null;
  message: string | null;
}

/** Data Confidence strip (doc 05 §4.3) — quality, not health. */
export interface DataConfidence {
  period: string;
  dcs: number | null;
  validityPct: number | null;
  trustQuotient: number | null;
  lowConfidence: boolean;
  asOf: string | null;
}

/** A single pre-vetted aggregate cell. `suppressed` ⇒ value is null (server-side). */
export interface MetricCell {
  metric: MetricKey;
  grain: Grain;
  grainRef: string | null; // dept/team/level id when grain != ORG
  grainLabel: string | null; // human label for the cell
  period: string; // "Q2-2026"
  value: number | null; // null when suppressed
  band: "green" | "amber" | "coral" | null;
  n: number; // cohort size (k≥5 floor; below → suppressed)
  suppressed: boolean;
  lowConfidence: boolean;
}

export type ParticipationStatus = "completed" | "pending" | "not_started";

/** Tier-2 named participation. Identity + status ONLY — never a score/response. */
export interface ParticipationRow {
  memberId: string;
  employeeName: string;
  department: string | null;
  team: string | null;
  level: "L1" | "L2" | "L3" | null;
  status: ParticipationStatus;
  lastReminderAt: string | null; // ISO
}

export interface SegmentationSlice {
  label: "High Stress" | "Borderline" | "Stress-Free";
  pct: number | null;
  suppressed: boolean;
}

export interface ByLevelOwi {
  level: "L1" | "L2" | "L3";
  owi: number | null;
  n: number;
  suppressed: boolean;
}

export interface TeamExtreme {
  team: string;
  owi: number | null;
  n: number;
  suppressed: boolean;
}

export interface CoverageTile {
  instrument: string; // "MHSF-III" | "Big-5" | "OBI" | "PSS"
  completedPct: number | null;
  suppressed: boolean;
}

export interface OverviewKpis {
  wellnessScore: number | null; // OWI
  wellnessDelta: number | null;
  highStressPct: number | null;
  /** null pre-Wave-1 data (OBI p75/p90 not yet set, B3) — render gradient/mean only. */
  burnoutRiskPct: number | null;
  therapyUtilizationPct: number | null;
}

/** Every payload carries a freshness stamp (doc 12 P1-7). */
export interface Freshness {
  asOf: string | null; // ISO snapshot freeze time; null = not yet computed
  status: "fresh" | "stale" | "not_yet_available" | "blocked_no_contract";
  snapshotId: string | null;
  metricVersion: string | null;
}

export interface OverviewPayload {
  period: string;
  freshness: Freshness;
  kpis: OverviewKpis;
  segmentation: SegmentationSlice[];
  byLevel: ByLevelOwi[];
  coverage: CoverageTile[];
  teamExtremes: {
    mostVulnerable: TeamExtreme | null;
    happiest: TeamExtreme | null;
  };
  // ⛔ no per-person names+scores. Named participation = the /participation query.
}

export interface FilterOptions {
  periods: string[];
  departments: { id: string; label: string }[];
  teams: { id: string; label: string }[];
  levels: { id: "L1" | "L2" | "L3"; label: string }[];
}

/**
 * WS-C Dashboard depth (doc 04 §2.3).
 * InsightCard — one Top-3 rail card: a Finding + a Play (+ optional Receipt),
 * derived from real published org-grain cells + QoQ movement. `severity` is the
 * calm ramp (green | amber | coral) — never red on this employer gradient surface.
 */
export interface InsightCard {
  id: string;
  severity: "green" | "amber" | "coral";
  metric: string;
  finding: string;
  play: string;
  receipt: string | null; // measured outcome once a verify ledger exists; null until then
}

/**
 * QuadrantPoint — one cohort on the Stress (x↑=worse) × Engagement (y↑=better)
 * plane. Aggregate-only, k≥5; both axes present or the point is omitted.
 */
export interface QuadrantPoint {
  grainRef: string | null;
  label: string;
  stress: number | null;
  engagement: number | null;
  n: number;
  suppressed: boolean;
}

/**
 * VerifyLedgerRow — one metric's before/after movement (doc 04 §2.3 Zone F / QBR §5).
 * Aggregate-only, k≥5 on BOTH quarters. CI present only for true rate metrics; for
 * composite/count metrics it is null (ciBasis says "pending"). `attribution` is
 * 'unlinked' until the ACT programmes engine books Plays — the ledger shows measured
 * movement, never a fabricated cause.
 */
export interface VerifyLedgerRow {
  metricKey: string;
  metricLabel: string;
  grain: "ORG" | "DEPARTMENT" | "TEAM" | "LEVEL";
  grainRef: string | null;
  cohortLabel: string;
  beforePeriod: string;
  beforeValue: number | null;
  afterPeriod: string;
  afterValue: number | null;
  delta: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  ciBasis: string;
  n: number;
  higherIsBetter: boolean;
  direction: "improved" | "regressed" | "flat";
  significant: boolean;
  state: "live" | "low_confidence" | "alert" | "celebration";
  attribution: string;
  insight: string;
}

/**
 * WS-L ACT zone (doc 04 §2.3 / GDAV "Act"). Programme/commerce surfaces ONLY —
 * aggregate-by-construction. NO score/response/risk field: a recommendation is an
 * off-target COHORT cell × an evidence-graded programme; an intervention references
 * a cohort (grain/grainRef), never a person.
 */
export interface OrgInterventionRecommendation {
  catalogueKey: string;
  name: string;
  category: string;
  targetMetricKey: string;
  metricLabel: string;
  grain: "ORG" | "DEPARTMENT" | "TEAM" | "LEVEL";
  grainRef: string | null;
  cohortLabel: string;
  currentValue: number | null;
  targetValue: number | null;
  shortfall: number | null;
  severity: "amber" | "coral";
  expectedEffectLow: number | null;
  expectedEffectHigh: number | null;
  evidenceGrade: "A" | "B" | "C";
  evidenceSummary: string | null;
  evidenceCitation: string | null;
  alreadyActive: boolean;
  rationale: string;
}

export type InterventionStatus =
  | "recommended"
  | "committee_review"
  | "booked"
  | "active"
  | "measuring"
  | "retired";

export interface OrgIntervention {
  id: string;
  catalogueKey: string;
  name: string;
  category: string;
  targetMetricKey: string;
  metricLabel: string;
  grain: "ORG" | "DEPARTMENT" | "TEAM" | "LEVEL";
  grainRef: string | null;
  cohortLabel: string;
  status: InterventionStatus;
  recommendedPeriod: string | null;
  bookedAt: string | null;
  committeeDecision: string | null;
  notes: string | null;
  evidenceGrade: "A" | "B" | "C";
  expectedEffectLow: number | null;
  expectedEffectHigh: number | null;
}

export interface BookInterventionInput {
  catalogueKey: string;
  grain?: "ORG" | "DEPARTMENT" | "TEAM" | "LEVEL" | null;
  grainRef?: string | null;
  period?: string | null;
  committeeDecision?: string | null;
  notes?: string | null;
}

export interface BookInterventionResult {
  ok: boolean;
  interventionId: string | null;
  status: string | null;
  wasNew: boolean;
  error: string | null;
}

/**
 * WS-L GOVERN / REPORTS zone (doc 04 §6 / GDAV "Govern"). Board-room accountability
 * surfaces over the published Privacy-Kernel metrics. Aggregate-only — every field is
 * a published k-safe value, a status, a count, or a cohort label. NO individual field.
 */
export interface EsgDisclosureLine {
  lineCode: string;
  lineLabel: string;
  metricKey: string;
  metricLabel: string;
  unit: string;
  status: "published" | "suppressed" | "pending";
  value: number | null;
  n: number | null;
  framework: string;
}

export interface CertificationCriterion {
  criterionCode: string; // '_TIER' on the summary header row
  criterionLabel: string;
  tier: "silver" | "gold" | "_summary";
  metricKey: string | null;
  threshold: number | null;
  comparator: ">=" | "<=" | null;
  // on criterion rows: 'met'|'unmet'|'pending'|'suppressed'; on the _TIER header: 'gold'|'silver'|'none'
  status: string;
  value: number | null;
  gap: number | null;
  note: string;
}

export interface CommitteeTrackerRow {
  interventionId: string | null;
  catalogueKey: string; // '_KPI' on the header row
  name: string;
  targetMetricKey: string | null;
  metricLabel: string | null;
  grain: string | null;
  cohortLabel: string | null;
  status: InterventionStatus | null;
  recommendedPeriod: string | null;
  bookedAt: string | null;
  committeeDecision: string | null;
  // KPI fields (populated only on the '_KPI' header row)
  totalCount: number | null;
  closedCount: number | null;
  closureRate: number | null;
}

export interface PrivacyKri {
  status: "ok" | "breach" | "pending";
  suppressionViolations: number | null;
  queriesAudited: number | null;
  lastAuditAt: string | null;
  privacyK: number;
  neverListNote: string;
  detail: string;
}

/**
 * WS-L RESIDUALS (b2b_77 / doc 04 §2.3 Bridge + §6). Three honest-or-pending
 * aggregate surfaces — Care-engaged %, the leadership team's own psych-safety, and
 * the analyst QBR overrides. Aggregate-only: counts, an org-grain value, or prose.
 */
export interface OrgCareEngagement {
  grain: string; // 'org'
  period: string;
  status: "live" | "pending" | "suppressed";
  engagedPct: number | null;
  engagedMembers: number | null;
  eligibleMembers: number | null;
  n: number | null;
  hasSource: boolean;
  detail: string;
}

// WS-U U0 — Manager Academy AGGREGATE completion (k≥5). Employer/L3/HR-only,
// AGGREGATE by construction: counts/rates per org + dept, never an individual.
export interface AcademyDeptCompletion {
  departmentId: string | null;
  status: string; // 'ok' | 'suppressed'
  enrolments: number | null;
  completed: number | null;
  completionRate: number | null;
}
export interface AcademyCompletion {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  period: string | null;
  enrolments: number | null;
  completed: number | null;
  completionRate: number | null;
  l3AdoptionStatus: string | null;
  l3AdoptionRate: number | null;
  byDepartment: AcademyDeptCompletion[];
}

// WS-U U2 — Blended Cohort AGGREGATE progress (k≥5; phase distribution only).
export interface CohortPhaseCount {
  phase: string;
  n: number | null; // null = suppressed (< k)
}
export interface OrgCohortProgress {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  cohortCode: string | null;
  totalEnrolments: number | null;
  byPhase: CohortPhaseCount[];
}

// WS-U U3 — Certification pass-rate AGGREGATE (k≥5; never an individual score).
export interface OrgCertPassrate {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  courseCode: string | null;
  candidates: number | null;
  certified: number | null;
  passRate: number | null;
}

export interface ExecTeamPsafety {
  grain: string; // 'org'
  period: string;
  status: "live" | "pending" | "suppressed";
  value: number | null;
  n: number | null;
  band: "strong" | "steady" | "building" | null; // calm gradient — no discrete alert
  priorPeriod: string | null;
  priorValue: number | null;
  delta: number | null;
  detail: string;
}

export type QbrSection = "story" | "forward_plan";

export interface QbrAnnotation {
  id: string;
  period: string;
  section: QbrSection;
  body: string;
  status: "draft" | "published";
  updatedAt: string | null;
}

export interface UpsertQbrAnnotationInput {
  period: string;
  section: QbrSection;
  body: string;
  status?: "draft" | "published" | null;
}

export interface UpsertQbrAnnotationResult {
  ok: boolean;
  id: string | null;
  status: string | null;
  wasNew: boolean;
  error: string | null;
}

// ============================================================================
// WS-R Coaching · Workshops · Training EMPLOYER AGGREGATES (Pillars C/D). All
// k≥5 — counts/rates only, never an individual engagement or score.
// ============================================================================
export interface OrgCoachingProductCount {
  engagementType: string;
  status: string; // 'ok' | 'suppressed'
  engagements: number | null;
  completed: number | null;
}
export interface OrgCoachingSummary {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  period: string | null;
  engagements: number | null;
  completed: number | null;
  gasMeanAttainment: number | null;
  byProduct: OrgCoachingProductCount[];
}
export interface OrgWorkshopCount {
  workshopCode: string;
  status: string; // 'ok' | 'suppressed'
  registrations: number | null;
  attended: number | null;
  meanCsat: number | null;
}
export interface OrgWorkshopSummary {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  period: string | null;
  registrations: number | null;
  attended: number | null;
  attendanceRate: number | null;
  meanCsat: number | null;
  byWorkshop: OrgWorkshopCount[];
}
export interface OrgMhfaCoverage {
  status: string; // 'computed' | 'no_program'
  programStatus: string | null;
  certifiedAiders: number | null;
  activeAiders: number | null;
  targetAiders: number | null;
  targetRatio: number | null;
  supervisionCadence: string | null;
  coveragePct: number | null;
}

// ============================================================================
// PHASE-2 EMPLOYER lifecycle / care / incident AGGREGATES (WS-S / WS-T / WS-W /
// WS-U U6). Every type is aggregate-only — a count, an org-grain value, or k≥5-
// suppressed per-bucket counts. Acceptance/use is structurally never disclosed for
// self-care, life-moment invitations, and offboard bridges; incident uptake
// suppresses the accepted count below k.
// ============================================================================
export interface SelfcareSurfaceCount {
  surface: string;
  events: number | null;
  members: number | null;
}
export interface OrgSelfcareEngagement {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  period: string | null;
  coveredLives: number | null;
  activeEngagers: number | null;
  bySurface: SelfcareSurfaceCount[];
  note: string | null;
}
export interface LifeMomentTypeCount {
  momentType: string;
  sent: number;
}
export interface OrgLifeInviteSummary {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  invitationsSent: number | null;
  byMomentType: LifeMomentTypeCount[];
  note: string | null;
}
export interface OrgBridgeSummary {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  bridgesOffered: number | null;
  note: string | null;
}
export interface OrgIncident {
  id: string;
  incidentType: string;
  severityTier: string | null;
  title: string | null;
  summary: string | null;
  status: string; // readiness | response | recovery | closed | active …
  scope: string | null;
  scopeRef: string | null;
  affectedEstimate: number | null;
  activatedAt: string | null;
  activationDueAt: string | null;
  irpIssuedAt: string | null;
  recoveryAt: string | null;
  closedAt: string | null;
  createdAt: string | null;
}
export interface OrgIncidents {
  status: string; // 'computed' | 'no_org'
  incidents: OrgIncident[];
}
export interface OrgIncidentUptake {
  status: string; // 'computed' | 'suppressed' | 'no_incident'
  k: number | null;
  offersSent: number | null;
  accepted: number | null; // null = suppressed below k
  acceptedSuppressed: boolean | null;
  note: string | null;
}
export interface ObservedConstruct {
  constructCode: string;
  status: string; // 'computed' | 'suppressed'
  sessions: number | null;
  observedMean: number | null; // 0–4 mean
}
export interface OrgObservedClimate {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  reliableSessions: number | null;
  observed: ObservedConstruct[];
}

export interface OrgBranding {
  organizationId: string;
  displayName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}

export interface DashboardFilters {
  period: string;
  department?: string | null;
  team?: string | null;
  level?: "L1" | "L2" | "L3" | null;
}

/** HR roster onboarding (Tier-2 identity, never wellbeing). */
export type AssignableRole =
  | "employee"
  | "manager"
  | "hr_ops"
  | "wellbeing_committee";

export interface ProvisionMemberInput {
  fullName: string;
  email: string;
  departmentId?: string | null;
  teamId?: string | null;
  level?: "L1" | "L2" | "L3" | null;
  orgRole?: AssignableRole | null;
}

export interface ProvisionResult {
  fullName: string;
  email: string;
  ok: boolean;
  memberId: string | null;
  employeeRef: string | null;
  inviteToken: string | null;
  error: string | null;
}

export interface RosterMember {
  memberId: string;
  fullName: string | null;
  employeeRef: string;
  level: "L1" | "L2" | "L3";
  department: string | null;
  team: string | null;
  memberStatus: "invited" | "active" | "suspended" | "offboarded";
  inviteStatus: "sent" | "accepted" | "expired" | "revoked" | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  linked: boolean;
}

export interface PendingInvite {
  memberId: string;
  fullName: string | null;
  email: string;
  token: string;
  link: string;
  expiresAt: string | null;
  sendCount: number;
  lastSentAt: string | null;
}

export interface InviteActionResult {
  memberId: string;
  ok: boolean;
  action: "resent" | "revoked" | "sent";
  token: string | null;
  link: string | null;
  delivered: boolean;
  parked: boolean;
  error: string | null;
}

/**
 * WS-O dynamic metrics — the two RICH aggregate surfaces (doc 10 §2.3 / §3). Both
 * AGGREGATE-only: org-level counts/rates + metric→metric pair comparisons. No
 * identity, no individual score/response. k≥5 enforced in-DB. The other four WS-O
 * metrics (Manager Calibration / Help-Seeking latency+conversion / Healthy
 * Step-Down) ride the existing MetricCell via metricCells.
 */
export interface ClinicalQuality {
  status: string; // 'computed' | 'suppressed' | 'no_org'
  k: number | null;
  membersWithFollowup: number | null;
  episodesWithFollowup: number | null;
  reliableImprovementRate: number | null;
  deteriorationFlagRate: number | null;
  careTrackEnrolmentsTotal: number | null;
  careTrackCompleted: number | null;
  careTrackCompletionRate: number | null;
  episodesTotal: number | null;
  episodesActive: number | null;
  episodesDischarged: number | null;
}

export interface GuardrailViolation {
  group: string;
  accelerator: string;
  brake: string;
  accelPrev: number | null;
  accelCurr: number | null;
  brakePrev: number | null;
  brakeCurr: number | null;
  detail: string;
}
export interface GuardrailViolations {
  status: string; // 'computed' | 'no_snapshot' | 'need_two_snapshots' | 'no_org'
  periodCurr: string | null;
  periodPrev: string | null;
  violationCount: number;
  violations: GuardrailViolation[];
}


// ── b2b_280/282/283 surfacing (family coverage / branding / proof engine) ──
export interface OrgFamilyCoverage {
  status: string;
  k: number | null;
  activeMembers: number | null;
  membersWithActiveDependent: number | null;
  pctMembersWithActiveDependent: number | null;
  note: string | null;
}
export interface OrgBrandingProfile {
  organizationId: string;
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  updatedAt: string | null;
}
export interface CostPerOutcomeRow {
  grain: string; interventionId: string | null; interventionName: string | null;
  catalogueKey: string | null; targetMetricKey: string | null; metricLabel: string | null;
  cohortLabel: string | null; costAmount: number | null; currency: string;
  reliableOutcomes: number | null; minOutcomeCohortN: number | null; costPerOutcome: number | null;
  ciBasis: string | null; suppressed: boolean; suppressionReason: string | null;
}
export interface OrgCostPerOutcome { orgId: string | null; period: string | null; privacyK: number | null; rows: CostPerOutcomeRow[]; }
export interface UnderperformingInterventionRow {
  interventionId: string | null; catalogueKey: string | null; targetMetricKey: string | null;
  metricLabel: string | null; grain: string | null; status: string | null; period: string | null;
  beforeValue: number | null; afterValue: number | null; delta: number | null; direction: string | null;
  n: number | null; expectedEffectLow: number | null; expectedEffectHigh: number | null;
  recommendation: string | null; signal: string | null;
}
export interface OrgUnderperformingInterventions { orgId: string | null; privacyK: number | null; effectFloorPoints: number | null; rows: UnderperformingInterventionRow[]; }

// ── G4 risk & impact (b2b_305/309/314 employer-guarded RPCs; live path) ──
export interface OrgRating {
  period: string | null; hazardIndex: number | null; band: string | null;
  constructsPresent: number | null; constructsConfigured: number | null;
  coverage: number | null; standard: string | null;
  suppressed: boolean; reason: string | null; k: number | null;
}
export interface RecoveryYield {
  window: string | null; coveredLives: number | null; reliableImprovements: number | null;
  recoveryYieldPer1000: number | null; suppressed: boolean; k: number | null;
}
export interface DecisionCostRow {
  id: string | null; decisionKey: string | null; decisionType: string | null; title: string | null;
  decidedAt: string | null; scopeGrain: string | null; scopeLevel: string | null;
  prePeriod: string | null; postPeriod: string | null;
  preOwi: number | null; postOwi: number | null; owiDelta: number | null;
  ciLow: number | null; ciHigh: number | null; nPre: number | null; nPost: number | null;
  suppressed: boolean; evidenceGrade: string | null; confounderNote: string | null; computedAt: string | null;
}
export interface DecisionCost { status: string | null; decisions: DecisionCostRow[]; }
export interface ValidityTier {
  status: string; period: string | null; kThreshold: number | null;
  invited: number | null; completed: number | null;
  participationPct: number | null; validityRate: number | null; tier: string | null;
  benchmarksVisible: boolean; resultsDirectional: boolean; billableDiagnosis: boolean;
}
export interface BenchmarkDelta {
  benchmarksVisible: boolean; metricKey: string | null; period: string | null; peerCellKey: string | null;
  p25: number | null; p50: number | null; p75: number | null;
  nOrgs: number | null; nLives: number | null;
  orgValue: number | null; deltaP50: number | null; position: string | null; reason: string | null;
}
export interface SectorPackOverlay { metricKey: string | null; label: string | null; emphasis: string | null; }
export interface SectorPack {
  assigned: boolean; key: string | null; name: string | null; sector: string | null;
  minMetricSet: string[]; kpiOverlays: SectorPackOverlay[];
}
export interface ParticipationDiagnosis {
  status: string; reportId: string | null; period: string | null; tier: string | null;
  participationPct: number | null; billable: boolean; departmentFindings: number | null; kThreshold: number | null;
}
