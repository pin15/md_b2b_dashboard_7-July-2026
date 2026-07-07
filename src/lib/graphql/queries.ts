/**
 * The vetted query shapes (the allowlist IS the API, doc 13 P0-1c). Only
 * fixed-grain selections — NO free-form `filter`/`where`, NO raw-row type, and
 * no field that resolves to an individual response/score/risk.
 *
 * In prod these are persisted/allowlisted queries; here they double as the
 * documents the mock layer recognises.
 */

export const OVERVIEW_QUERY = /* GraphQL */ `
  query Overview($period: String!, $department: ID, $level: String) {
    overview(period: $period, department: $department, level: $level) {
      period
      freshness { asOf status snapshotId metricVersion }
      kpis {
        wellnessScore
        wellnessDelta
        highStressPct
        burnoutRiskPct
        therapyUtilizationPct
      }
      segmentation { label pct suppressed }
      byLevel { level owi n suppressed }
      coverage { instrument completedPct suppressed }
      teamExtremes {
        mostVulnerable { team owi n suppressed }
        happiest { team owi n suppressed }
      }
    }
  }
`;

export const METRIC_CELLS_QUERY = /* GraphQL */ `
  query MetricCells($metric: MetricKey!, $grain: Grain!, $period: String!) {
    metricCells(metric: $metric, grain: $grain, period: $period) {
      metric grain grainRef grainLabel period
      value band n suppressed lowConfidence
    }
  }
`;

export const PARTICIPATION_QUERY = /* GraphQL */ `
  query Participation($period: String!, $department: ID, $team: ID, $level: String) {
    participation(period: $period, department: $department, team: $team, level: $level) {
      memberId employeeName department team level status lastReminderAt
    }
  }
`;

export const FILTER_OPTIONS_QUERY = /* GraphQL */ `
  query FilterOptions {
    filterOptions {
      periods
      departments { id label }
      teams { id label }
      levels { id label }
    }
  }
`;

export const BRANDING_QUERY = /* GraphQL */ `
  query OrgBranding {
    orgBranding { organizationId displayName logoUrl primaryColor accentColor }
  }
`;

export const ORG_ROI_QUERY = /* GraphQL */ `
  query OrgRoi($period: String!, $grain: Grain, $avgSalary: Float, $avgDailyCost: Float, $replacementCost: Float, $headcount: Float, $programmeCost: Float) {
    orgRoi(period: $period, grain: $grain, avgSalary: $avgSalary, avgDailyCost: $avgDailyCost, replacementCost: $replacementCost, headcount: $headcount, programmeCost: $programmeCost) {
      label roiMultiple lowConfidence
      presenteeism { label delta savings }
      absence { label delta savings }
      attrition { label delta savings }
    }
  }
`;

export const DATA_CONFIDENCE_QUERY = /* GraphQL */ `
  query DataConfidence($period: String!) {
    dataConfidence(period: $period) {
      period dcs validityPct trustQuotient lowConfidence asOf
    }
  }
`;

export const TEAM_HOME_QUERY = /* GraphQL */ `
  query TeamHome($period: String!) {
    teamHome(period: $period) {
      status team n participationPct wellbeingBand validityPct finding play message
    }
  }
`;

export const MANAGER_360_QUERY = /* GraphQL */ `
  query Manager360 {
    managerThreeSixty {
      status suppressed mode minRaters completedRaters
      selfOverall raterOverall overallGap interpretation reason
      domains { domain selfMean raterMean raterMin raterMax nRaters gap }
    }
  }
`;

export const METRIC_TREND_QUERY = /* GraphQL */ `
  query MetricTrend($metric: MetricKey!, $grain: Grain!) {
    metricTrend(metric: $metric, grain: $grain) { period value n suppressed }
  }
`;

// WS-C Dashboard depth (doc 04 §2.3 B) — Top-3 Insight Rail.
export const ORG_INSIGHTS_QUERY = /* GraphQL */ `
  query OrgInsights($period: String!) {
    orgInsights(period: $period) { id severity metric finding play receipt }
  }
`;

// WS-C Dashboard depth (doc 04 §2.3 D) — Stress × Engagement motion quadrant.
export const ORG_QUADRANT_QUERY = /* GraphQL */ `
  query OrgQuadrant($period: String!, $grain: Grain) {
    orgQuadrant(period: $period, grain: $grain) { grainRef label stress engagement n suppressed }
  }
`;

// verifyLedger (WS-L, doc 04 §2.3 F / QBR §5) — before/after deltas with 95% CIs.
// Must match the persisted allowlist entry in apps/api/src/graphql/limits.ts verbatim.
export const VERIFY_LEDGER_QUERY = /* GraphQL */ `
  query VerifyLedger($period: String!) {
    verifyLedger(period: $period) {
      metricKey metricLabel grain grainRef cohortLabel
      beforePeriod beforeValue afterPeriod afterValue delta
      ciLower ciUpper ciBasis n higherIsBetter direction significant state attribution insight
    }
  }
`;

// WS-L ACT zone (doc 04 §2.3 / GDAV "Act"). These 3 docs must hash-match the
// persisted allowlist entries in apps/api/src/graphql/limits.ts (queryHash gates
// prod; it collapses whitespace, so formatting differs but the shape is identical).
export const ORG_INTERVENTION_RECOMMENDATIONS_QUERY = /* GraphQL */ `
  query OrgInterventionRecommendations($period: String!) {
    orgInterventionRecommendations(period: $period) {
      catalogueKey name category targetMetricKey metricLabel grain grainRef cohortLabel
      currentValue targetValue shortfall severity expectedEffectLow expectedEffectHigh
      evidenceGrade evidenceSummary evidenceCitation alreadyActive rationale
    }
  }
`;

export const ORG_INTERVENTIONS_QUERY = /* GraphQL */ `
  query OrgInterventions {
    orgInterventions {
      id catalogueKey name category targetMetricKey metricLabel grain grainRef cohortLabel
      status recommendedPeriod bookedAt committeeDecision notes evidenceGrade
      expectedEffectLow expectedEffectHigh
    }
  }
`;

export const BOOK_ORG_INTERVENTION_MUTATION = /* GraphQL */ `
  mutation BookOrgIntervention($input: BookInterventionInput!) {
    bookOrgIntervention(input: $input) { ok interventionId status wasNew error }
  }
`;

// WS-L GOVERN zone (doc 04 §6). These 4 docs must hash-match the persisted allowlist
// entries in apps/api/src/graphql/limits.ts (queryHash collapses whitespace).
export const ORG_ESG_DISCLOSURE_QUERY = /* GraphQL */ `
  query OrgEsgDisclosure($period: String!) {
    orgEsgDisclosure(period: $period) {
      lineCode lineLabel metricKey metricLabel unit status value n framework
    }
  }
`;

export const ORG_CERTIFICATION_QUERY = /* GraphQL */ `
  query OrgCertification($period: String!) {
    orgCertification(period: $period) {
      criterionCode criterionLabel tier metricKey threshold comparator status value gap note
    }
  }
`;

export const ORG_COMMITTEE_TRACKER_QUERY = /* GraphQL */ `
  query OrgCommitteeTracker {
    orgCommitteeTracker {
      interventionId catalogueKey name targetMetricKey metricLabel grain cohortLabel
      status recommendedPeriod bookedAt committeeDecision totalCount closedCount closureRate
    }
  }
`;

export const ORG_PRIVACY_KRI_QUERY = /* GraphQL */ `
  query OrgPrivacyKri {
    orgPrivacyKri {
      status suppressionViolations queriesAudited lastAuditAt privacyK neverListNote detail
    }
  }
`;

// WS-L RESIDUALS (b2b_77 / doc 04 §2.3 Bridge + §6). These 4 docs must hash-match the
// persisted allowlist entries in apps/api/src/graphql/limits.ts (queryHash collapses
// whitespace, so formatting differs but the shape is identical).
export const ORG_CARE_ENGAGEMENT_QUERY = /* GraphQL */ `
  query OrgCareEngagement($period: String!) {
    orgCareEngagement(period: $period) {
      grain period status engagedPct engagedMembers eligibleMembers n hasSource detail
    }
  }
`;

// WS-U U0 — Manager Academy AGGREGATE completion (k≥5; no individual fields).
// Must stay byte-identical (after whitespace-normalisation) to the API allowlist.
export const ORG_ACADEMY_COMPLETION_QUERY = /* GraphQL */ `
  query OrgAcademyCompletion($period: String) {
    orgAcademyCompletion(period: $period) {
      status k period enrolments completed completionRate l3AdoptionStatus l3AdoptionRate byDepartment { departmentId status enrolments completed completionRate }
    }
  }
`;

// WS-U U2 — Blended Cohort AGGREGATE progress (k≥5; phase distribution only).
// Whitespace-normalised to match the API persisted-query allowlist exactly.
export const ORG_COHORT_PROGRESS_QUERY = /* GraphQL */ `
  query OrgCohortProgress($cohortCode: String) {
    orgCohortProgress(cohortCode: $cohortCode) {
      status k cohortCode totalEnrolments byPhase { phase n }
    }
  }
`;

// WS-U U3 — Certification pass-rate AGGREGATE (k≥5; candidate/cert counts + rate).
export const ORG_CERT_PASSRATE_QUERY = /* GraphQL */ `
  query OrgCertPassrate($courseCode: String) {
    orgCertPassrate(courseCode: $courseCode) {
      status k courseCode candidates certified passRate
    }
  }
`;

export const EXEC_TEAM_PSAFETY_QUERY = /* GraphQL */ `
  query ExecTeamPsafety($period: String!) {
    execTeamPsafety(period: $period) {
      grain period status value n band priorPeriod priorValue delta detail
    }
  }
`;

export const QBR_ANNOTATIONS_QUERY = /* GraphQL */ `
  query QbrAnnotations($period: String!) {
    qbrAnnotations(period: $period) {
      id period section body status updatedAt
    }
  }
`;

export const UPSERT_QBR_ANNOTATION_MUTATION = /* GraphQL */ `
  mutation UpsertQbrAnnotation($input: UpsertQbrAnnotationInput!) {
    upsertQbrAnnotation(input: $input) { ok id status wasNew error }
  }
`;

export const ORG_ROSTER_QUERY = /* GraphQL */ `
  query OrgRoster {
    orgRoster {
      memberId fullName employeeRef level department team
      memberStatus inviteStatus invitedAt acceptedAt linked
    }
  }
`;

export const PROVISION_MEMBERS_MUTATION = /* GraphQL */ `
  mutation ProvisionOrgMembers($rows: [ProvisionMemberInput!]!) {
    provisionOrgMembers(rows: $rows) {
      fullName email ok memberId employeeRef inviteToken error
    }
  }
`;

export const PENDING_INVITES_QUERY = /* GraphQL */ `
  query PendingInvites {
    pendingInvites {
      memberId fullName email token link expiresAt sendCount lastSentAt
    }
  }
`;

const INVITE_ACTION_FIELDS = "memberId ok action token link delivered parked error";

export const RESEND_INVITE_MUTATION = /* GraphQL */ `
  mutation ResendInvite($memberId: String!) {
    resendInvite(memberId: $memberId) { ${INVITE_ACTION_FIELDS} }
  }
`;

export const REVOKE_INVITE_MUTATION = /* GraphQL */ `
  mutation RevokeInvite($memberId: String!) {
    revokeInvite(memberId: $memberId) { ${INVITE_ACTION_FIELDS} }
  }
`;

export const SEND_INVITE_MUTATION = /* GraphQL */ `
  mutation SendInvite($memberId: String!) {
    sendInvite(memberId: $memberId) { ${INVITE_ACTION_FIELDS} }
  }
`;

export const SEND_ALL_PENDING_MUTATION = /* GraphQL */ `
  mutation SendAllPendingInvites {
    sendAllPendingInvites { ${INVITE_ACTION_FIELDS} }
  }
`;

// ============================================================================
// WS-R Coaching · Workshops · Training EMPLOYER AGGREGATES (Pillars C/D). Must
// whitespace-normalise to the API persisted-query allowlist (limits.ts) exactly.
// ============================================================================
export const ORG_COACHING_SUMMARY_QUERY = /* GraphQL */ `
  query OrgCoachingSummary($period: String) {
    orgCoachingSummary(period: $period) {
      status k period engagements completed gasMeanAttainment byProduct { engagementType status engagements completed }
    }
  }
`;

export const ORG_WORKSHOP_SUMMARY_QUERY = /* GraphQL */ `
  query OrgWorkshopSummary($period: String) {
    orgWorkshopSummary(period: $period) {
      status k period registrations attended attendanceRate meanCsat byWorkshop { workshopCode status registrations attended meanCsat }
    }
  }
`;

export const ORG_MHFA_COVERAGE_QUERY = /* GraphQL */ `
  query OrgMhfaCoverage {
    orgMhfaCoverage { status programStatus certifiedAiders activeAiders targetAiders targetRatio supervisionCadence coveragePct }
  }
`;

// ============================================================================
// PHASE-2 EMPLOYER lifecycle / care / incident AGGREGATES (WS-S/T/W/U U6). Each
// MUST whitespace-normalise to the API persisted-query allowlist (limits.ts).
// ============================================================================
export const ORG_SELFCARE_ENGAGEMENT_QUERY = /* GraphQL */ `
  query OrgSelfcareEngagement($period: String) {
    orgSelfcareEngagement(period: $period) {
      status k period coveredLives activeEngagers bySurface { surface events members } note
    }
  }
`;

export const ORG_LIFE_INVITE_SUMMARY_QUERY = /* GraphQL */ `
  query OrgLifeInviteSummary {
    orgLifeInviteSummary { status k invitationsSent byMomentType { momentType sent } note }
  }
`;

export const ORG_BRIDGE_SUMMARY_QUERY = /* GraphQL */ `
  query OrgBridgeSummary {
    orgBridgeSummary { status k bridgesOffered note }
  }
`;

export const ORG_INCIDENTS_QUERY = /* GraphQL */ `
  query OrgIncidents {
    orgIncidents {
      status incidents { id incidentType severityTier title summary status scope scopeRef affectedEstimate activatedAt activationDueAt irpIssuedAt recoveryAt closedAt createdAt }
    }
  }
`;

export const ORG_INCIDENT_UPTAKE_QUERY = /* GraphQL */ `
  query OrgIncidentUptake($incidentId: ID!) {
    orgIncidentUptake(incidentId: $incidentId) { status k offersSent accepted acceptedSuppressed note }
  }
`;

export const ORG_OBSERVED_CLIMATE_QUERY = /* GraphQL */ `
  query OrgObservedClimate {
    orgObservedClimate { status k reliableSessions observed { constructCode status sessions observedMean } }
  }
`;

// ============================================================================
// WS-O dynamic metrics (b2b_115–120) — the two RICH aggregate surfaces. Each MUST
// whitespace-normalise to the API persisted-query allowlist (limits.ts) exactly.
// The other four WS-O metrics use METRIC_CELLS_QUERY (no new query document).
// ============================================================================
export const CLINICAL_QUALITY_QUERY = /* GraphQL */ `
  query ClinicalQuality($period: String!) {
    clinicalQuality(period: $period) {
      status k membersWithFollowup episodesWithFollowup reliableImprovementRate deteriorationFlagRate careTrackEnrolmentsTotal careTrackCompleted careTrackCompletionRate episodesTotal episodesActive episodesDischarged
    }
  }
`;

export const GUARDRAIL_VIOLATIONS_QUERY = /* GraphQL */ `
  query GuardrailViolations($period: String!) {
    guardrailViolations(period: $period) {
      status periodCurr periodPrev violationCount violations { group accelerator brake accelPrev accelCurr brakePrev brakeCurr detail }
    }
  }
`;


// ── b2b_280/282/283 surfacing ──
export const ORG_FAMILY_COVERAGE_QUERY = /* GraphQL */ `
  query OrgFamilyCoverage { orgFamilyCoverage { status k activeMembers membersWithActiveDependent pctMembersWithActiveDependent note } }
`;
export const ORG_BRANDING_PROFILE_QUERY = /* GraphQL */ `
  query OrgBrandingProfile { orgBrandingProfile { organizationId displayName logoUrl primaryColor accentColor updatedAt } }
`;
export const ORG_COST_PER_OUTCOME_QUERY = /* GraphQL */ `
  query OrgCostPerOutcome($period: String!) {
    orgCostPerOutcome(period: $period) {
      orgId period privacyK
      rows { grain interventionId interventionName catalogueKey targetMetricKey metricLabel cohortLabel costAmount currency reliableOutcomes minOutcomeCohortN costPerOutcome ciBasis suppressed suppressionReason }
    }
  }
`;
export const ORG_UNDERPERFORMING_INTERVENTIONS_QUERY = /* GraphQL */ `
  query OrgUnderperformingInterventions {
    orgUnderperformingInterventions {
      orgId privacyK effectFloorPoints
      rows { interventionId catalogueKey targetMetricKey metricLabel grain status period beforeValue afterValue delta direction n expectedEffectLow expectedEffectHigh recommendation signal }
    }
  }
`;

// ── G4 risk & impact (b2b_305/309/314) ──
export const ORG_RATING_QUERY = /* GraphQL */ `
  query OrgRating($period: String!) {
    orgRating(period: $period) {
      period hazardIndex band constructsPresent constructsConfigured coverage standard suppressed reason k
    }
  }
`;
export const RECOVERY_YIELD_QUERY = /* GraphQL */ `
  query RecoveryYield {
    recoveryYield {
      window coveredLives reliableImprovements recoveryYieldPer1000 suppressed k
    }
  }
`;
export const DECISION_COST_QUERY = /* GraphQL */ `
  query DecisionCost {
    decisionCost {
      status
      decisions {
        id decisionKey decisionType title decidedAt scopeGrain scopeLevel prePeriod postPeriod
        preOwi postOwi owiDelta ciLow ciHigh nPre nPost suppressed evidenceGrade confounderNote computedAt
      }
    }
  }
`;
export const VALIDITY_TIER_QUERY = /* GraphQL */ `
  query ValidityTier($period: String!) {
    validityTier(period: $period) {
      status period kThreshold invited completed participationPct validityRate tier
      benchmarksVisible resultsDirectional billableDiagnosis
    }
  }
`;

export const ORG_BENCHMARK_DELTA_QUERY = /* GraphQL */ `
  query OrgBenchmarkDelta($metric: String!, $period: String!) {
    orgBenchmarkDelta(metric: $metric, period: $period) {
      benchmarksVisible metricKey period peerCellKey
      p25 p50 p75 nOrgs nLives orgValue deltaP50 position reason
    }
  }
`;

export const ORG_SECTOR_PACK_QUERY = /* GraphQL */ `
  query OrgSectorPack {
    orgSectorPack {
      assigned key name sector
      minMetricSet
      kpiOverlays { metricKey label emphasis }
    }
  }
`;
export const PARTICIPATION_DIAGNOSIS_QUERY = /* GraphQL */ `
  query ParticipationDiagnosis($period: String!) {
    participationDiagnosis(period: $period) {
      status reportId period tier participationPct billable departmentFindings kThreshold
    }
  }
`;
