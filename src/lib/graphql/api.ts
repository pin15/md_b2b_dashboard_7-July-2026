import { USE_MOCK } from "@/lib/env";
import { gqlRequest } from "./client";
import { ORG_FAMILY_COVERAGE_QUERY, ORG_BRANDING_PROFILE_QUERY, ORG_COST_PER_OUTCOME_QUERY, ORG_UNDERPERFORMING_INTERVENTIONS_QUERY } from "./queries";
import { ORG_RATING_QUERY, RECOVERY_YIELD_QUERY, DECISION_COST_QUERY, VALIDITY_TIER_QUERY, PARTICIPATION_DIAGNOSIS_QUERY } from "./queries";
import type { OrgFamilyCoverage, OrgBrandingProfile, OrgCostPerOutcome, OrgUnderperformingInterventions } from "./types";
import type { OrgRating, RecoveryYield, DecisionCost, ValidityTier, ParticipationDiagnosis } from "./types";
import {
  OVERVIEW_QUERY,
  PARTICIPATION_QUERY,
  FILTER_OPTIONS_QUERY,
  BRANDING_QUERY,
  METRIC_CELLS_QUERY,
  ORG_ROI_QUERY,
  DATA_CONFIDENCE_QUERY,
  TEAM_HOME_QUERY,
  METRIC_TREND_QUERY,
  ORG_INSIGHTS_QUERY,
  ORG_QUADRANT_QUERY,
  ORG_ROSTER_QUERY,
  PROVISION_MEMBERS_MUTATION,
  PENDING_INVITES_QUERY,
  RESEND_INVITE_MUTATION,
  REVOKE_INVITE_MUTATION,
  SEND_INVITE_MUTATION,
  SEND_ALL_PENDING_MUTATION,
  VERIFY_LEDGER_QUERY,
  ORG_INTERVENTION_RECOMMENDATIONS_QUERY,
  ORG_INTERVENTIONS_QUERY,
  BOOK_ORG_INTERVENTION_MUTATION,
  ORG_ESG_DISCLOSURE_QUERY,
  ORG_CERTIFICATION_QUERY,
  ORG_COMMITTEE_TRACKER_QUERY,
  ORG_PRIVACY_KRI_QUERY,
  ORG_CARE_ENGAGEMENT_QUERY,
  ORG_ACADEMY_COMPLETION_QUERY,
  ORG_COHORT_PROGRESS_QUERY,
  ORG_CERT_PASSRATE_QUERY,
  EXEC_TEAM_PSAFETY_QUERY,
  QBR_ANNOTATIONS_QUERY,
  UPSERT_QBR_ANNOTATION_MUTATION,
  ORG_COACHING_SUMMARY_QUERY,
  ORG_WORKSHOP_SUMMARY_QUERY,
  ORG_MHFA_COVERAGE_QUERY,
  ORG_SELFCARE_ENGAGEMENT_QUERY,
  ORG_LIFE_INVITE_SUMMARY_QUERY,
  ORG_BRIDGE_SUMMARY_QUERY,
  ORG_INCIDENTS_QUERY,
  ORG_INCIDENT_UPTAKE_QUERY,
  ORG_OBSERVED_CLIMATE_QUERY,
  CLINICAL_QUALITY_QUERY,
  GUARDRAIL_VIOLATIONS_QUERY,
  ORG_BENCHMARK_DELTA_QUERY,
  ORG_SECTOR_PACK_QUERY,
  MANAGER_360_QUERY,
} from "./queries";
import {
  mockOverview,
  mockParticipation,
  mockMetricCells,
  mockOrgRoi,
  mockDataConfidence,
  mockTeamHome,
  mockManager360,
  mockMetricTrend,
  mockOrgInsights,
  mockOrgQuadrant,
  mockVerifyLedger,
  mockOrgInterventionRecommendations,
  mockOrgInterventions,
  mockOrgEsgDisclosure,
  mockOrgCertification,
  mockOrgCommitteeTracker,
  mockOrgPrivacyKri,
  mockOrgCareEngagement,
  mockOrgAcademyCompletion,
  mockOrgCohortProgress,
  mockOrgCertPassrate,
  mockExecTeamPsafety,
  mockQbrAnnotations,
  mockOrgRoster,
  mockProvision,
  mockPendingInvites,
  mockOrgCoachingSummary,
  mockOrgWorkshopSummary,
  mockOrgMhfaCoverage,
  mockOrgSelfcareEngagement,
  mockOrgLifeInviteSummary,
  mockOrgBridgeSummary,
  mockOrgIncidents,
  mockOrgIncidentUptake,
  mockOrgObservedClimate,
  mockClinicalQuality,
  mockGuardrailViolations,
  MOCK_FILTER_OPTIONS,
  MOCK_BRANDING,
} from "./mock";
import type {
  OverviewPayload,
  ParticipationRow,
  FilterOptions,
  OrgBranding,
  MetricCell,
  MetricKey,
  Grain,
  OrgRoi,
  DataConfidence,
  TeamHome,
  Manager360,
  TrendPoint,
  InsightCard,
  QuadrantPoint,
  VerifyLedgerRow,
  OrgInterventionRecommendation,
  OrgIntervention,
  BookInterventionInput,
  BookInterventionResult,
  EsgDisclosureLine,
  CertificationCriterion,
  CommitteeTrackerRow,
  PrivacyKri,
  OrgCareEngagement,
  AcademyCompletion,
  OrgCohortProgress,
  OrgCertPassrate,
  ExecTeamPsafety,
  QbrAnnotation,
  UpsertQbrAnnotationInput,
  UpsertQbrAnnotationResult,
  OrgCoachingSummary,
  OrgWorkshopSummary,
  OrgMhfaCoverage,
  OrgSelfcareEngagement,
  OrgLifeInviteSummary,
  OrgBridgeSummary,
  OrgIncidents,
  OrgIncidentUptake,
  OrgObservedClimate,
  ClinicalQuality,
  GuardrailViolations,
  DashboardFilters,
  RosterMember,
  ProvisionMemberInput,
  ProvisionResult,
  PendingInvite,
  InviteActionResult,
} from "./types";

/** Default cost assumptions for the ROI demo (HR-entered in production). */
export const ROI_COST_DEFAULTS = {
  avgSalary: 1_200_000,
  avgDailyCost: 5_000,
  replacementCost: 1_500_000,
  headcount: 140,
  programmeCost: 5_000_000,
} as const;

/**
 * The data API for the dashboard. Each function returns the SAME typed shape
 * whether it served a mock fixture or a live GraphQL response — so swapping to
 * the real backend is just flipping NEXT_PUBLIC_USE_MOCK / setting the URL.
 *
 * `grain` for level filtering maps to the schema's Grain enum value "LEVEL"; the
 * specific level is passed via the typed filter and (in live mode) resolved by
 * the pre-materialised grain. No free-form filter is ever sent (P0-1).
 */

export async function getOverview(
  filters: DashboardFilters,
): Promise<OverviewPayload> {
  if (USE_MOCK) return mockOverview(filters);
  const data = await gqlRequest<{ overview: OverviewPayload }>(OVERVIEW_QUERY, {
    period: filters.period,
    department: filters.department ?? null,
    level: filters.level ?? null,
  });
  return data.overview;
}

export async function getParticipation(
  filters: DashboardFilters,
): Promise<ParticipationRow[]> {
  if (USE_MOCK) return mockParticipation(filters);
  const data = await gqlRequest<{ participation: ParticipationRow[] }>(
    PARTICIPATION_QUERY,
    {
      period: filters.period,
      department: filters.department ?? null,
      team: filters.team ?? null,
      level: filters.level ?? null,
    },
  );
  // The GraphQL enum serialises status uppercase (COMPLETED); the UI keys on the
  // lowercase union (completed). Normalise so live + mock data render identically.
  return data.participation.map((r) => ({
    ...r,
    status: String(r.status).toLowerCase() as ParticipationRow["status"],
  }));
}

export async function getMetricCells(
  metric: MetricKey,
  grain: Grain,
  period: string,
): Promise<MetricCell[]> {
  if (USE_MOCK) return mockMetricCells(metric, grain, period);
  const data = await gqlRequest<{ metricCells: MetricCell[] }>(
    METRIC_CELLS_QUERY,
    { metric, grain, period },
  );
  return data.metricCells;
}

export async function getOrgRoi(
  period: string,
  costs: typeof ROI_COST_DEFAULTS = ROI_COST_DEFAULTS,
): Promise<OrgRoi> {
  if (USE_MOCK) return mockOrgRoi(period);
  const data = await gqlRequest<{ orgRoi: OrgRoi }>(ORG_ROI_QUERY, {
    period,
    grain: "ORG",
    ...costs,
  });
  return data.orgRoi;
}

export async function getDataConfidence(period: string): Promise<DataConfidence> {
  if (USE_MOCK) return mockDataConfidence(period);
  const data = await gqlRequest<{ dataConfidence: DataConfidence }>(
    DATA_CONFIDENCE_QUERY,
    { period },
  );
  return data.dataConfidence;
}

export async function getMetricTrend(metric: MetricKey, grain: Grain = "ORG"): Promise<TrendPoint[]> {
  if (USE_MOCK) return mockMetricTrend(metric);
  const data = await gqlRequest<{ metricTrend: TrendPoint[] }>(METRIC_TREND_QUERY, { metric, grain });
  return data.metricTrend;
}

export async function getTeamHome(period: string): Promise<TeamHome> {
  if (USE_MOCK) return mockTeamHome(period);
  const data = await gqlRequest<{ teamHome: TeamHome }>(TEAM_HOME_QUERY, { period });
  return data.teamHome;
}

/** Manager 360 — own report only (subject derived in-DB from auth.uid). ≥4-rater floor. */
export async function getManager360(): Promise<Manager360> {
  if (USE_MOCK) return mockManager360();
  const data = await gqlRequest<{ managerThreeSixty: Manager360 }>(MANAGER_360_QUERY, {});
  return data.managerThreeSixty;
}

/** Top-3 Insight Rail (doc 04 §2.3 B). Aggregate-only; ≤3 Finding/Play cards. */
export async function getOrgInsights(period: string): Promise<InsightCard[]> {
  if (USE_MOCK) return mockOrgInsights(period);
  const data = await gqlRequest<{ orgInsights: InsightCard[] }>(ORG_INSIGHTS_QUERY, { period });
  return data.orgInsights;
}

/** Stress × Engagement motion quadrant points (doc 04 §2.3 D). Empty until PSS/UWES land. */
export async function getOrgQuadrant(
  period: string,
  grain: Grain = "DEPARTMENT",
): Promise<QuadrantPoint[]> {
  if (USE_MOCK) return mockOrgQuadrant(period, grain);
  const data = await gqlRequest<{ orgQuadrant: QuadrantPoint[] }>(ORG_QUADRANT_QUERY, {
    period,
    grain,
  });
  return data.orgQuadrant;
}

export async function getVerifyLedger(period: string): Promise<VerifyLedgerRow[]> {
  if (USE_MOCK) return mockVerifyLedger(period);
  const data = await gqlRequest<{ verifyLedger: VerifyLedgerRow[] }>(
    VERIFY_LEDGER_QUERY,
    { period },
  );
  return data.verifyLedger;
}

/** ACT recommendations (doc 04 §2.3). Off-target cells × evidence library; honest-empty. */
export async function getOrgInterventionRecommendations(
  period: string,
): Promise<OrgInterventionRecommendation[]> {
  if (USE_MOCK) return mockOrgInterventionRecommendations(period);
  const data = await gqlRequest<{
    orgInterventionRecommendations: OrgInterventionRecommendation[];
  }>(ORG_INTERVENTION_RECOMMENDATIONS_QUERY, { period });
  return data.orgInterventionRecommendations;
}

/** ACT lifecycle board feed (doc 04 §2.3). Aggregate-only (cohort labels). */
export async function getOrgInterventions(): Promise<OrgIntervention[]> {
  if (USE_MOCK) return mockOrgInterventions();
  const data = await gqlRequest<{ orgInterventions: OrgIntervention[] }>(
    ORG_INTERVENTIONS_QUERY,
  );
  return data.orgInterventions;
}

/** ACT committee book — upsert a cohort-scoped programme to 'booked' (idempotent). */
export async function bookOrgIntervention(
  input: BookInterventionInput,
): Promise<BookInterventionResult> {
  const data = await gqlRequest<{ bookOrgIntervention: BookInterventionResult }>(
    BOOK_ORG_INTERVENTION_MUTATION,
    { input },
  );
  return data.bookOrgIntervention;
}

/** GOVERN ESG disclosure (doc 04 §6). BRSR Principle-3 → published k-safe values. */
export async function getOrgEsgDisclosure(
  period: string,
): Promise<EsgDisclosureLine[]> {
  if (USE_MOCK) return mockOrgEsgDisclosure(period);
  const data = await gqlRequest<{ orgEsgDisclosure: EsgDisclosureLine[] }>(
    ORG_ESG_DISCLOSURE_QUERY,
    { period },
  );
  return data.orgEsgDisclosure;
}

/** GOVERN certification (doc 04 §6). Advisory Silver/Gold rubric; authority pending D12. */
export async function getOrgCertification(
  period: string,
): Promise<CertificationCriterion[]> {
  if (USE_MOCK) return mockOrgCertification(period);
  const data = await gqlRequest<{ orgCertification: CertificationCriterion[] }>(
    ORG_CERTIFICATION_QUERY,
    { period },
  );
  return data.orgCertification;
}

/** GOVERN committee tracker (doc 04 §6). ACT board + action-closure-rate KPI. */
export async function getOrgCommitteeTracker(): Promise<CommitteeTrackerRow[]> {
  if (USE_MOCK) return mockOrgCommitteeTracker();
  const data = await gqlRequest<{ orgCommitteeTracker: CommitteeTrackerRow[] }>(
    ORG_COMMITTEE_TRACKER_QUERY,
  );
  return data.orgCommitteeTracker;
}

/** GOVERN Data & Privacy KRI (doc 04 §6). Honest 'pending' until WS-J lands. */
export async function getOrgPrivacyKri(): Promise<PrivacyKri> {
  if (USE_MOCK) return mockOrgPrivacyKri();
  const data = await gqlRequest<{ orgPrivacyKri: PrivacyKri }>(
    ORG_PRIVACY_KRI_QUERY,
  );
  return data.orgPrivacyKri;
}

/** Care-engaged % (WS-L residuals, b2b_77). Org-grain; honest-pending until booking data. */
export async function getOrgCareEngagement(period: string): Promise<OrgCareEngagement> {
  if (USE_MOCK) return mockOrgCareEngagement(period);
  const data = await gqlRequest<{ orgCareEngagement: OrgCareEngagement }>(
    ORG_CARE_ENGAGEMENT_QUERY,
    { period },
  );
  return data.orgCareEngagement;
}

/** Manager Academy AGGREGATE completion (WS-U U0, b2b_181/182). k≥5; never an individual. */
export async function getOrgAcademyCompletion(period: string): Promise<AcademyCompletion> {
  if (USE_MOCK) return mockOrgAcademyCompletion(period);
  const data = await gqlRequest<{ orgAcademyCompletion: AcademyCompletion }>(
    ORG_ACADEMY_COMPLETION_QUERY,
    { period },
  );
  return data.orgAcademyCompletion;
}

/** Blended-cohort AGGREGATE progress (WS-U U2, b2b_184). k≥5; phase counts only. */
export async function getOrgCohortProgress(cohortCode: string | null): Promise<OrgCohortProgress> {
  if (USE_MOCK) return mockOrgCohortProgress(cohortCode);
  const data = await gqlRequest<{ orgCohortProgress: OrgCohortProgress }>(
    ORG_COHORT_PROGRESS_QUERY,
    { cohortCode },
  );
  return data.orgCohortProgress;
}

/** Certification pass-rate AGGREGATE (WS-U U3, b2b_185/186). k≥5; never an individual score. */
export async function getOrgCertPassrate(courseCode: string | null): Promise<OrgCertPassrate> {
  if (USE_MOCK) return mockOrgCertPassrate(courseCode);
  const data = await gqlRequest<{ orgCertPassrate: OrgCertPassrate }>(
    ORG_CERT_PASSRATE_QUERY,
    { courseCode },
  );
  return data.orgCertPassrate;
}

/** Exec-team psych-safety (WS-L residuals, b2b_77). Calm gradient; pending until published. */
export async function getExecTeamPsafety(period: string): Promise<ExecTeamPsafety> {
  if (USE_MOCK) return mockExecTeamPsafety(period);
  const data = await gqlRequest<{ execTeamPsafety: ExecTeamPsafety }>(
    EXEC_TEAM_PSAFETY_QUERY,
    { period },
  );
  return data.execTeamPsafety;
}

/** QBR analyst annotations (WS-L residuals, b2b_77). Employer prose for §2/§6. */
export async function getQbrAnnotations(period: string): Promise<QbrAnnotation[]> {
  if (USE_MOCK) return mockQbrAnnotations(period);
  const data = await gqlRequest<{ qbrAnnotations: QbrAnnotation[] }>(
    QBR_ANNOTATIONS_QUERY,
    { period },
  );
  return data.qbrAnnotations;
}

/** Upsert a QBR annotation (WS-L residuals, b2b_77). Simple employer-admin write gate. */
export async function upsertQbrAnnotation(
  input: UpsertQbrAnnotationInput,
): Promise<UpsertQbrAnnotationResult> {
  const data = await gqlRequest<{ upsertQbrAnnotation: UpsertQbrAnnotationResult }>(
    UPSERT_QBR_ANNOTATION_MUTATION,
    { input },
  );
  return data.upsertQbrAnnotation;
}

// ── WS-R Coaching · Workshops · Training EMPLOYER AGGREGATES (Pillars C/D) ──
/** Coaching summary AGGREGATE (k≥5; counts/rates only, never an individual engagement). */
export async function getOrgCoachingSummary(period: string): Promise<OrgCoachingSummary> {
  if (USE_MOCK) return mockOrgCoachingSummary(period);
  const data = await gqlRequest<{ orgCoachingSummary: OrgCoachingSummary }>(
    ORG_COACHING_SUMMARY_QUERY,
    { period },
  );
  return data.orgCoachingSummary;
}

/** Workshop summary AGGREGATE (k≥5; registrations/attendance/CSAT). */
export async function getOrgWorkshopSummary(period: string): Promise<OrgWorkshopSummary> {
  if (USE_MOCK) return mockOrgWorkshopSummary(period);
  const data = await gqlRequest<{ orgWorkshopSummary: OrgWorkshopSummary }>(
    ORG_WORKSHOP_SUMMARY_QUERY,
    { period },
  );
  return data.orgWorkshopSummary;
}

/** MHFA coverage governance KPI (counts only; honest 'no_program' until a programme exists). */
export async function getOrgMhfaCoverage(): Promise<OrgMhfaCoverage> {
  if (USE_MOCK) return mockOrgMhfaCoverage();
  const data = await gqlRequest<{ orgMhfaCoverage: OrgMhfaCoverage }>(ORG_MHFA_COVERAGE_QUERY);
  return data.orgMhfaCoverage;
}

// ── PHASE-2 lifecycle / care / incident AGGREGATES (WS-S/T/W/U U6) ──
/** Self-care engagement AGGREGATE (engagement-only; per-surface k≥5; never an outcome/individual). */
export async function getOrgSelfcareEngagement(period: string | null): Promise<OrgSelfcareEngagement> {
  if (USE_MOCK) return mockOrgSelfcareEngagement(period ?? "last_30d");
  const data = await gqlRequest<{ orgSelfcareEngagement: OrgSelfcareEngagement }>(
    ORG_SELFCARE_ENGAGEMENT_QUERY,
    { period: period ?? null },
  );
  return data.orgSelfcareEngagement;
}

/** Life-moment invitations SENT (k≥5; acceptance/decline/use NEVER disclosed). */
export async function getOrgLifeInviteSummary(): Promise<OrgLifeInviteSummary> {
  if (USE_MOCK) return mockOrgLifeInviteSummary();
  const data = await gqlRequest<{ orgLifeInviteSummary: OrgLifeInviteSummary }>(
    ORG_LIFE_INVITE_SUMMARY_QUERY,
  );
  return data.orgLifeInviteSummary;
}

/** Offboard bridges OFFERED (k≥5; acceptance/use NEVER disclosed). */
export async function getOrgBridgeSummary(): Promise<OrgBridgeSummary> {
  if (USE_MOCK) return mockOrgBridgeSummary();
  const data = await gqlRequest<{ orgBridgeSummary: OrgBridgeSummary }>(ORG_BRIDGE_SUMMARY_QUERY);
  return data.orgBridgeSummary;
}

/** Org critical-incident register (no member data; readiness/SLA timeline only). */
export async function getOrgIncidents(): Promise<OrgIncidents> {
  if (USE_MOCK) return mockOrgIncidents();
  const data = await gqlRequest<{ orgIncidents: OrgIncidents }>(ORG_INCIDENTS_QUERY);
  return data.orgIncidents;
}

/** Per-incident uptake (offers sent; accepted count suppressed below k). */
export async function getOrgIncidentUptake(incidentId: string): Promise<OrgIncidentUptake> {
  if (USE_MOCK) return mockOrgIncidentUptake(incidentId);
  const data = await gqlRequest<{ orgIncidentUptake: OrgIncidentUptake }>(
    ORG_INCIDENT_UPTAKE_QUERY,
    { incidentId },
  );
  return data.orgIncidentUptake;
}

/** FieldLens observed climate (κ-reliable sessions; per-construct mean, k≥5). */
export async function getOrgObservedClimate(): Promise<OrgObservedClimate> {
  if (USE_MOCK) return mockOrgObservedClimate();
  const data = await gqlRequest<{ orgObservedClimate: OrgObservedClimate }>(ORG_OBSERVED_CLIMATE_QUERY);
  return data.orgObservedClimate;
}

// ── WS-O dynamic metrics — the two RICH aggregate surfaces (b2b_115–120) ──
/** KCI clinical scorecard AGGREGATE (k≥5; suppressed below member-follow-up k). */
export async function getClinicalQuality(period: string): Promise<ClinicalQuality> {
  if (USE_MOCK) return mockClinicalQuality(period);
  const data = await gqlRequest<{ clinicalQuality: ClinicalQuality }>(
    CLINICAL_QUALITY_QUERY,
    { period },
  );
  return data.clinicalQuality;
}

/** Anti-Goodhart guardrail-violation strip (QoQ over the 2 latest published snapshots). */
export async function getGuardrailViolations(period: string): Promise<GuardrailViolations> {
  if (USE_MOCK) return mockGuardrailViolations(period);
  const data = await gqlRequest<{ guardrailViolations: GuardrailViolations }>(
    GUARDRAIL_VIOLATIONS_QUERY,
    { period },
  );
  return data.guardrailViolations;
}

export async function getFilterOptions(): Promise<FilterOptions> {
  if (USE_MOCK) return MOCK_FILTER_OPTIONS;
  const data = await gqlRequest<{ filterOptions: FilterOptions }>(
    FILTER_OPTIONS_QUERY,
  );
  return data.filterOptions;
}

export async function getBranding(): Promise<OrgBranding> {
  if (USE_MOCK) return MOCK_BRANDING;
  const data = await gqlRequest<{ orgBranding: OrgBranding }>(BRANDING_QUERY);
  return data.orgBranding;
}

export async function getOrgRoster(): Promise<RosterMember[]> {
  if (USE_MOCK) return mockOrgRoster();
  const data = await gqlRequest<{ orgRoster: RosterMember[] }>(ORG_ROSTER_QUERY);
  return data.orgRoster;
}

export async function provisionOrgMembers(
  rows: ProvisionMemberInput[],
): Promise<ProvisionResult[]> {
  if (USE_MOCK) return mockProvision(rows);
  const data = await gqlRequest<{ provisionOrgMembers: ProvisionResult[] }>(
    PROVISION_MEMBERS_MUTATION,
    { rows },
  );
  return data.provisionOrgMembers;
}

export async function getPendingInvites(): Promise<PendingInvite[]> {
  if (USE_MOCK) return mockPendingInvites();
  const data = await gqlRequest<{ pendingInvites: PendingInvite[] }>(
    PENDING_INVITES_QUERY,
  );
  return data.pendingInvites;
}

export async function resendInvite(memberId: string): Promise<InviteActionResult> {
  const data = await gqlRequest<{ resendInvite: InviteActionResult }>(
    RESEND_INVITE_MUTATION,
    { memberId },
  );
  return data.resendInvite;
}

export async function revokeInvite(memberId: string): Promise<InviteActionResult> {
  const data = await gqlRequest<{ revokeInvite: InviteActionResult }>(
    REVOKE_INVITE_MUTATION,
    { memberId },
  );
  return data.revokeInvite;
}

export async function sendInvite(memberId: string): Promise<InviteActionResult> {
  const data = await gqlRequest<{ sendInvite: InviteActionResult }>(
    SEND_INVITE_MUTATION,
    { memberId },
  );
  return data.sendInvite;
}

export async function sendAllPendingInvites(): Promise<InviteActionResult[]> {
  const data = await gqlRequest<{ sendAllPendingInvites: InviteActionResult[] }>(
    SEND_ALL_PENDING_MUTATION,
  );
  return data.sendAllPendingInvites;
}


// ── b2b_280/282/283 surfacing (employer-guarded RPCs; live path) ──
export async function getOrgFamilyCoverage(): Promise<OrgFamilyCoverage> {
  const data = await gqlRequest<{ orgFamilyCoverage: OrgFamilyCoverage }>(ORG_FAMILY_COVERAGE_QUERY);
  return data.orgFamilyCoverage;
}
export async function getOrgBrandingProfile(): Promise<OrgBrandingProfile> {
  const data = await gqlRequest<{ orgBrandingProfile: OrgBrandingProfile }>(ORG_BRANDING_PROFILE_QUERY);
  return data.orgBrandingProfile;
}
export async function getOrgCostPerOutcome(period: string): Promise<OrgCostPerOutcome> {
  const data = await gqlRequest<{ orgCostPerOutcome: OrgCostPerOutcome }>(ORG_COST_PER_OUTCOME_QUERY, { period });
  return data.orgCostPerOutcome;
}
export async function getOrgUnderperformingInterventions(): Promise<OrgUnderperformingInterventions> {
  const data = await gqlRequest<{ orgUnderperformingInterventions: OrgUnderperformingInterventions }>(ORG_UNDERPERFORMING_INTERVENTIONS_QUERY);
  return data.orgUnderperformingInterventions;
}

// ── G4 risk & impact (b2b_305/309/314 employer-guarded RPCs; live path) ──
export async function getOrgRating(period: string): Promise<OrgRating | null> {
  const data = await gqlRequest<{ orgRating: OrgRating | null }>(ORG_RATING_QUERY, { period });
  return data.orgRating;
}
export async function getRecoveryYield(): Promise<RecoveryYield | null> {
  const data = await gqlRequest<{ recoveryYield: RecoveryYield | null }>(RECOVERY_YIELD_QUERY);
  return data.recoveryYield;
}
export async function getDecisionCost(): Promise<DecisionCost> {
  const data = await gqlRequest<{ decisionCost: DecisionCost }>(DECISION_COST_QUERY);
  return data.decisionCost;
}
export async function getValidityTier(period: string): Promise<ValidityTier | null> {
  const data = await gqlRequest<{ validityTier: ValidityTier | null }>(VALIDITY_TIER_QUERY, { period });
  return data.validityTier;
}
export async function getOrgBenchmarkDelta(metric: string, period: string): Promise<import("./types").BenchmarkDelta | null> {
  const data = await gqlRequest<{ orgBenchmarkDelta: import("./types").BenchmarkDelta | null }>(
    ORG_BENCHMARK_DELTA_QUERY, { metric, period }
  );
  return data.orgBenchmarkDelta;
}
export async function getOrgSectorPack(): Promise<import("./types").SectorPack | null> {
  const data = await gqlRequest<{ orgSectorPack: import("./types").SectorPack | null }>(ORG_SECTOR_PACK_QUERY, {});
  return data.orgSectorPack;
}
export async function getParticipationDiagnosis(period: string): Promise<ParticipationDiagnosis> {
  const data = await gqlRequest<{ participationDiagnosis: ParticipationDiagnosis }>(PARTICIPATION_DIAGNOSIS_QUERY, { period });
  return data.participationDiagnosis;
}
