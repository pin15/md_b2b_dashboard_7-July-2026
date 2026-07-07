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
  TrendPoint,
  DashboardFilters,
  RosterMember,
  ProvisionMemberInput,
  ProvisionResult,
  Manager360,
} from "./types";

/** Manager-360 fixture — a self-higher "blind spot" gap (matches the demo review). */
export function mockManager360(): Manager360 {
  return {
    status: "ok",
    suppressed: false,
    mode: "full_360",
    minRaters: 4,
    completedRaters: 4,
    selfOverall: 4.12,
    raterOverall: 3.45,
    overallGap: 0.67,
    interpretation: "blind_spot_self_higher",
    reason: null,
    domains: [
      { domain: "self_awareness", selfMean: 4.2, raterMean: 3.53, raterMin: 3.3, raterMax: 3.7, nRaters: 4, gap: 0.67 },
      { domain: "clarity", selfMean: 4.4, raterMean: 3.73, raterMin: 3.5, raterMax: 3.9, nRaters: 4, gap: 0.67 },
      { domain: "fairness", selfMean: 3.9, raterMean: 3.23, raterMin: 3.0, raterMax: 3.4, nRaters: 4, gap: 0.67 },
    ],
  };
}

/** Trend fixture — two quarters, matching the local demo. */
export function mockMetricTrend(metric: MetricKey): TrendPoint[] {
  const pairs: Record<string, [number, number]> = {
    PARTICIPATION_PCT: [68, 76.5],
    RESPONSE_VALIDITY_RATE: [88, 47.1],
    TRUST_QUOTIENT: [50, 28.1],
    BRI: [54, 51.8],
    dcs: [74, 69.9],
  };
  const v = pairs[metric] ?? [60, 62];
  return [
    { period: "2026-Q1", value: v[0], n: 17, suppressed: false },
    { period: "2026-Q2", value: v[1], n: 17, suppressed: false },
  ];
}

/** My-Teams fixture — matches the local manager (Engineering Team) demo. */
export function mockTeamHome(_period: string): TeamHome {
  return {
    status: "ok",
    team: "Engineering Team",
    n: 8,
    participationPct: 87.5,
    wellbeingBand: "amber",
    validityPct: 50,
    finding: "Team wellbeing is steady, with room to improve.",
    play: "Pick one workload or role-clarity issue to fix this month.",
    message: null,
  };
}

/**
 * Mock fixtures (doc §9, build mock-first). Deterministic, realistic, and
 * privacy-correct: includes at least one SUPPRESSED cell (n<5) and a null
 * burnout KPI (pre-Wave-1, B3) so the UI's "below reporting threshold" and
 * "pending" paths are exercised before any backend exists.
 *
 * Demo org: "ACME", period Q2-2026.
 */

export const MOCK_BRANDING: OrgBranding = {
  organizationId: "mock-org-acme",
  displayName: "ACME",
  logoUrl: null,
  primaryColor: "#7C3AED",
  accentColor: "#7C3AED",
};

export const MOCK_FILTER_OPTIONS: FilterOptions = {
  periods: ["2026-Q2", "2026-Q1", "2025-Q4"],
  departments: [
    { id: "eng", label: "Engineering" },
    { id: "sales", label: "Sales" },
    { id: "ops", label: "Operations" },
    { id: "exec", label: "Executive" },
  ],
  teams: [
    { id: "eng-team", label: "Engineering Team" },
    { id: "sales-team", label: "Sales Team" },
    { id: "exec-team", label: "Executive Team" },
  ],
  levels: [
    { id: "L1", label: "L1 — Individual Contributors" },
    { id: "L2", label: "L2 — Managers" },
    { id: "L3", label: "L3 — Senior Leaders" },
  ],
};

/**
 * Top-3 Insight Rail fixture (doc 04 §2.3 B) — concern-first, matching the local
 * demo's real QoQ movement. Mirrors what get_org_insight_cards returns live.
 */
export function mockOrgInsights(_period: string): import("./types").InsightCard[] {
  return [
    {
      id: "response_validity_rate",
      severity: "coral",
      metric: "RESPONSE_VALIDITY_RATE",
      finding: "Response validity is down 40.9 pts to 47.1% vs 2026-Q1.",
      play: "Shorten or re-time the battery and reassure on privacy to lift answer quality.",
      receipt: null,
    },
    {
      id: "trust_quotient",
      severity: "coral",
      metric: "TRUST_QUOTIENT",
      finding: "Trust Quotient is down 21.9 pts to 28.1% vs 2026-Q1.",
      play: "Publish what acted on last cycle; visible follow-through is what rebuilds trust.",
      receipt: null,
    },
    {
      id: "participation_pct",
      severity: "green",
      metric: "PARTICIPATION_PCT",
      finding: "Participation is up 8.5 pts to 76.5% vs 2026-Q1.",
      play: "Hold the cadence — keep the reminder rhythm and thank teams for engaging.",
      receipt: null,
    },
  ];
}

/**
 * Stress × Engagement quadrant fixture (doc 04 §2.3 D). Empty by design until the
 * PSS-high% and UWES cells are computed — the surface shows its honest "building"
 * state rather than a fabricated cloud (matches get_org_quadrant today).
 */
export function mockOrgQuadrant(
  _period: string,
  _grain: Grain,
): import("./types").QuadrantPoint[] {
  return [];
}

// Honest-empty by default (mirrors the quadrant mock): the verify ledger only fills
// once a second quarter is published. The live API serves real before/after deltas.
export function mockVerifyLedger(
  _period: string,
): import("./types").VerifyLedgerRow[] {
  return [];
}

// ACT recommendations honest-empty by default (mirrors verify/quadrant): they only
// fill when a published metric reads off-target at k≥5. The live API serves real
// off-target cells × the seeded evidence library.
export function mockOrgInterventionRecommendations(
  _period: string,
): import("./types").OrgInterventionRecommendation[] {
  return [];
}

// The lifecycle board is honest-empty until a committee books a programme.
export function mockOrgInterventions(): import("./types").OrgIntervention[] {
  return [];
}

// GOVERN mocks — honest-empty / honest-pending by default (mirrors verify/quadrant).
// The live API serves real published-vs-suppressed values; the privacy KRI degrades
// to 'pending' until WS-J's kernel_query_log lands — never a fabricated 0.
export function mockOrgEsgDisclosure(
  _period: string,
): import("./types").EsgDisclosureLine[] {
  return [];
}

export function mockOrgCertification(
  _period: string,
): import("./types").CertificationCriterion[] {
  return [];
}

export function mockOrgCommitteeTracker(): import("./types").CommitteeTrackerRow[] {
  return [];
}

// WS-L residual mocks (b2b_77) — honest-pending by default (mirrors verify/quadrant).
// The live API serves the real org-grain values once booking data / a published
// PSYCH_SAFETY cell exists; the mock never fabricates a percentage or a score.
export function mockOrgCareEngagement(
  period: string,
): import("./types").OrgCareEngagement {
  return {
    grain: "org",
    period,
    status: "pending",
    engagedPct: null,
    engagedMembers: null,
    eligibleMembers: null,
    n: null,
    hasSource: false,
    detail:
      "Care-engaged % is pending — it lights up once members begin using their funded care (no employer-tagged bookings yet). Never a fabricated 0%.",
  };
}

export function mockExecTeamPsafety(
  period: string,
): import("./types").ExecTeamPsafety {
  return {
    grain: "org",
    period,
    status: "pending",
    value: null,
    n: null,
    band: null,
    priorPeriod: null,
    priorValue: null,
    delta: null,
    detail:
      "The leadership team's psychological-safety reading is pending — it appears once the Edmondson instrument publishes for this organisation at k≥5.",
  };
}

// QBR annotations are honest-empty until an analyst writes one.
export function mockQbrAnnotations(
  _period: string,
): import("./types").QbrAnnotation[] {
  return [];
}

export function mockOrgPrivacyKri(): import("./types").PrivacyKri {
  return {
    status: "pending",
    suppressionViolations: null,
    queriesAudited: null,
    lastAuditAt: null,
    privacyK: 5,
    neverListNote:
      "Never exposed: individual responses, raw scores, free-text journals, identity-linked risk, any cohort below k.",
    detail:
      "Suppression-violation auditing comes online with the Privacy Kernel query log (WS-J). Until then this KRI is honestly pending — not a fabricated zero.",
  };
}

export function mockOverview(filters: DashboardFilters): OverviewPayload {
  // Vary a couple of numbers by filter so URL-synced filters visibly do something.
  const deptBump =
    filters.department === "sales" ? -6 : filters.department === "exec" ? +4 : 0;
  const wellness = 78 + deptBump;
  const highStress = filters.department === "sales" ? 31 : 24;

  return {
    period: filters.period,
    freshness: {
      asOf: "2026-06-15T18:30:00.000Z",
      status: "fresh",
      snapshotId: "snap_q2_2026_acme_001",
      metricVersion: "owi@1.0.0",
    },
    kpis: {
      wellnessScore: wellness,
      wellnessDelta: 3,
      highStressPct: highStress,
      // null pre-Wave-1: OBI p75/p90 not yet set (B3) → no % KPI, gradient only.
      burnoutRiskPct: null,
      therapyUtilizationPct: 27,
    },
    segmentation: [
      { label: "High Stress", pct: highStress, suppressed: false },
      { label: "Borderline", pct: 41, suppressed: false },
      { label: "Stress-Free", pct: 100 - highStress - 41, suppressed: false },
    ],
    byLevel: [
      { level: "L1", owi: 74, n: 142, suppressed: false },
      { level: "L2", owi: 69, n: 38, suppressed: false },
      // L3 cohort < k → suppressed (demonstrates the k≥5 floor).
      { level: "L3", owi: null, n: 3, suppressed: true },
    ],
    coverage: [
      { instrument: "MHSF-III", completedPct: 81, suppressed: false },
      { instrument: "Big-5", completedPct: 64, suppressed: false },
      { instrument: "OBI", completedPct: 72, suppressed: false },
      { instrument: "PSS", completedPct: 88, suppressed: false },
    ],
    teamExtremes: {
      mostVulnerable: { team: "Field Sales – West", owi: 58, n: 12, suppressed: false },
      happiest: { team: "Platform", owi: 86, n: 9, suppressed: false },
    },
  };
}

/** Health & Risk / generic cells — includes a suppressed dept cell. */
export function mockMetricCells(
  metric: MetricKey,
  grain: Grain,
  period: string,
): MetricCell[] {
  // VDI is a distribution: one cell per clinical band (cohort_key = band).
  if (metric === "VDI") {
    const dist: Array<[string, number, number, boolean]> = [
      ["low", 47, 8, false],
      ["moderate", 24, 6, false],
      ["high", 18, 5, false],
      ["critical", 11, 3, true], // n<5 → suppressed
    ];
    return dist.map(([band, pct, n, suppressed]) => ({
      metric,
      grain: "ORG" as Grain,
      grainRef: band,
      grainLabel: band,
      period,
      value: suppressed ? null : pct,
      band: null, // VDI cells carry the clinical band in grainLabel, not the colour band
      n,
      suppressed,
      lowConfidence: false,
    }));
  }
  if (grain === "DEPARTMENT") {
    return [
      cell(metric, grain, "eng", "Engineering", period, 72, 64, false),
      cell(metric, grain, "sales", "Sales", period, 61, 40, false),
      cell(metric, grain, "ops", "Operations", period, 69, 27, false),
      // Executive dept too small → suppressed.
      cell(metric, grain, "exec", "Executive", period, null, 4, true),
    ];
  }
  if (grain === "LEVEL") {
    return [
      cell(metric, grain, "L1", "L1", period, 74, 142, false),
      cell(metric, grain, "L2", "L2", period, 69, 38, false),
      cell(metric, grain, "L3", "L3", period, null, 3, true),
    ];
  }
  return [cell(metric, "ORG", null, "All", period, 71, 207, false)];
}

function cell(
  metric: MetricKey,
  grain: Grain,
  grainRef: string | null,
  grainLabel: string | null,
  period: string,
  value: number | null,
  n: number,
  suppressed: boolean,
): MetricCell {
  const band =
    suppressed || value === null
      ? null
      : value >= 70
        ? "green"
        : value >= 55
          ? "amber"
          : "coral";
  return {
    metric,
    grain,
    grainRef,
    grainLabel,
    period,
    value: suppressed ? null : value,
    band,
    n,
    suppressed,
    lowConfidence: !suppressed && n < 10,
  };
}

const NAMES: Array<[string, string, string, "L1" | "L2" | "L3"]> = [
  ["Aarav Sharma", "Engineering", "Platform", "L1"],
  ["Diya Patel", "Engineering", "Platform", "L1"],
  ["Vivaan Rao", "Engineering", "Mobile", "L2"],
  ["Ananya Iyer", "Sales", "Field Sales – West", "L1"],
  ["Kabir Nair", "Sales", "Field Sales – West", "L1"],
  ["Ishaan Gupta", "Sales", "Inside Sales", "L2"],
  ["Saanvi Reddy", "Operations", "Support", "L1"],
  ["Arjun Mehta", "Operations", "Support", "L1"],
  ["Aisha Khan", "Operations", "Logistics", "L2"],
  ["Rohan Das", "Executive", "Leadership", "L3"],
  ["Meera Joshi", "Engineering", "Mobile", "L1"],
  ["Kiara Singh", "Sales", "Inside Sales", "L1"],
];

export function mockParticipation(filters: DashboardFilters): ParticipationRow[] {
  const statuses: ParticipationRow["status"][] = [
    "completed",
    "completed",
    "pending",
    "completed",
    "not_started",
    "completed",
    "pending",
    "completed",
    "completed",
    "not_started",
    "completed",
    "pending",
  ];
  const deptLabel: Record<string, string> = {
    eng: "Engineering",
    sales: "Sales",
    ops: "Operations",
    exec: "Executive",
  };
  const wantDept = filters.department ? deptLabel[filters.department] : null;

  return NAMES.map(([employeeName, department, team, level], i) => ({
    memberId: `mock-member-${i + 1}`,
    employeeName,
    department,
    team,
    level,
    status: statuses[i] ?? "pending",
    lastReminderAt:
      statuses[i] === "completed" ? null : "2026-06-10T09:00:00.000Z",
  }))
    .filter((r) => (wantDept ? r.department === wantDept : true))
    .filter((r) => (filters.level ? r.level === filters.level : true));
}

/** Data Confidence fixture (doc 05 §4.3) — matches the local-DB RQI demo numbers. */
export function mockDataConfidence(period: string): DataConfidence {
  return {
    period,
    dcs: 74.5,
    validityPct: 70.6,
    trustQuotient: 54,
    lowConfidence: true,
    asOf: "2026-06-15T18:30:00.000Z",
  };
}

/** Programme ROI fixture (doc 11) — matches the synthetic local-DB demo numbers. */
export function mockOrgRoi(_period: string): OrgRoi {
  return {
    label: "based on self-reported WPAI-GH data",
    roiMultiple: 1.18,
    presenteeism: { label: "Presenteeism", delta: 6.0, savings: 1_224_000 },
    absence: { label: "Absence", delta: -1.3, savings: 110_500 },
    attrition: { label: "Attrition", delta: -0.04, savings: 1_020_000 },
    lowConfidence: false,
  };
}

/** Roster onboarding fixtures (USE_MOCK only). */
export function mockOrgRoster(): RosterMember[] {
  return [
    {
      memberId: "mock-1",
      fullName: "Asha Rao",
      employeeRef: "EMP-mock0001",
      level: "L2",
      department: "Engineering",
      team: null,
      memberStatus: "invited",
      inviteStatus: "sent",
      invitedAt: "2026-06-18T00:00:00.000Z",
      acceptedAt: null,
      linked: false,
    },
  ];
}

export function mockProvision(rows: ProvisionMemberInput[]): ProvisionResult[] {
  return rows.map((r, i) => ({
    fullName: r.fullName,
    email: r.email,
    ok: true,
    memberId: `mock-${i}`,
    employeeRef: `EMP-mock${String(i).padStart(4, "0")}`,
    inviteToken: `mock_token_${i}`,
    error: null,
  }));
}

export function mockPendingInvites(): import("./types").PendingInvite[] {
  return [
    {
      memberId: "mock-1",
      fullName: "Asha Rao",
      email: "asha@company.com",
      token: "mock_token_1",
      link: "http://localhost:3001/auth/org-invite/mock_token_1",
      expiresAt: "2026-07-02T00:00:00.000Z",
      sendCount: 0,
      lastSentAt: null,
    },
  ];
}

// WS-U U0 — Manager Academy AGGREGATE completion mock (k≥5; never an individual).
export function mockOrgAcademyCompletion(
  period: string,
): import("./types").AcademyCompletion {
  return {
    status: "computed",
    k: 5,
    period,
    enrolments: 18,
    completed: 11,
    completionRate: 61.1,
    l3AdoptionStatus: "computed",
    l3AdoptionRate: 72.7,
    byDepartment: [
      { departmentId: "Engineering", status: "ok", enrolments: 8, completed: 5, completionRate: 62.5 },
      { departmentId: "Sales", status: "ok", enrolments: 6, completed: 4, completionRate: 66.7 },
      { departmentId: "People", status: "suppressed", enrolments: null, completed: null, completionRate: null },
    ],
  };
}

// WS-U U2 — Blended Cohort AGGREGATE progress fixture (k≥5; phase counts only).
export function mockOrgCohortProgress(
  cohortCode: string | null,
): import("./types").OrgCohortProgress {
  return {
    status: "computed",
    k: 5,
    cohortCode: cohortCode ?? "D30-2026Q3-A",
    totalEnrolments: 18,
    byPhase: [
      { phase: "async", n: 7 },
      { phase: "spaced", n: 6 },
      { phase: "live", n: null }, // suppressed (< k)
      { phase: "completed", n: 5 },
    ],
  };
}

// WS-U U3 — Certification pass-rate AGGREGATE fixture (k≥5; never an individual score).
export function mockOrgCertPassrate(
  courseCode: string | null,
): import("./types").OrgCertPassrate {
  return {
    status: "computed",
    k: 5,
    courseCode: courseCode ?? "D30",
    candidates: 12,
    certified: 9,
    passRate: 75.0,
  };
}

// WS-R — coaching summary AGGREGATE fixture (k≥5; counts/rates only).
export function mockOrgCoachingSummary(
  period: string,
): import("./types").OrgCoachingSummary {
  return {
    status: "computed",
    k: 5,
    period,
    engagements: 14,
    completed: 8,
    gasMeanAttainment: 0.6,
    byProduct: [
      { engagementType: "C2", status: "ok", engagements: 6, completed: 4 },
      { engagementType: "C4", status: "ok", engagements: 5, completed: 3 },
      { engagementType: "C1", status: "suppressed", engagements: null, completed: null },
    ],
  };
}

// WS-R — workshop summary AGGREGATE fixture (k≥5; registrations/attendance/CSAT).
export function mockOrgWorkshopSummary(
  period: string,
): import("./types").OrgWorkshopSummary {
  return {
    status: "computed",
    k: 5,
    period,
    registrations: 32,
    attended: 25,
    attendanceRate: 78.1,
    meanCsat: 4.4,
    byWorkshop: [
      { workshopCode: "WS-RESILIENCE", status: "ok", registrations: 12, attended: 10, meanCsat: 4.5 },
      { workshopCode: "WS-SLEEP", status: "ok", registrations: 9, attended: 7, meanCsat: 4.3 },
      { workshopCode: "WS-FINANCE", status: "suppressed", registrations: null, attended: null, meanCsat: null },
    ],
  };
}

// WS-R — MHFA coverage KPI fixture (counts only).
export function mockOrgMhfaCoverage(): import("./types").OrgMhfaCoverage {
  return {
    status: "computed",
    programStatus: "active",
    certifiedAiders: 9,
    activeAiders: 7,
    targetAiders: 12,
    targetRatio: 50,
    supervisionCadence: "quarterly",
    coveragePct: 58.3,
  };
}

// WS-S F0 — org self-care engagement fixture (engagement-only; per-surface k≥5).
export function mockOrgSelfcareEngagement(
  period: string,
): import("./types").OrgSelfcareEngagement {
  return {
    status: "computed",
    k: 5,
    period: period ?? "last_30d",
    coveredLives: 120,
    activeEngagers: 41,
    bySurface: [
      { surface: "programmes", events: 88, members: 22 },
      { surface: "mindfulness", events: 140, members: 31 },
      { surface: "journal", events: 60, members: 12 },
    ],
    note: "engagement only — outcome is measured separately; no individual exposure",
  };
}

// WS-T G/T4 — life-moment invitations SENT fixture (acceptance never disclosed).
export function mockOrgLifeInviteSummary(): import("./types").OrgLifeInviteSummary {
  return {
    status: "computed",
    k: 5,
    invitationsSent: 23,
    byMomentType: [
      { momentType: "new_parent", sent: 9 },
      { momentType: "bereavement", sent: 7 },
      { momentType: "caregiving", sent: 7 },
    ],
    note: "aggregate SENT count only — acceptance, decline, and use are never disclosed",
  };
}

// WS-T M0 — offboard bridges OFFERED fixture (acceptance/use never disclosed).
export function mockOrgBridgeSummary(): import("./types").OrgBridgeSummary {
  return {
    status: "computed",
    k: 5,
    bridgesOffered: 11,
    note: "aggregate offer count only — acceptance, decline, and use are never disclosed",
  };
}

// WS-W E — org critical-incident register fixture (no member data).
export function mockOrgIncidents(): import("./types").OrgIncidents {
  return {
    status: "computed",
    incidents: [
      {
        id: "inc-1",
        incidentType: "critical_incident",
        severityTier: "S2",
        title: "Site safety event",
        summary: "Readiness retainer activated; CRT lead assigned.",
        status: "response",
        scope: "org_wide",
        scopeRef: null,
        affectedEstimate: 40,
        activatedAt: "2026-05-02T09:00:00Z",
        activationDueAt: "2026-05-03T09:00:00Z",
        irpIssuedAt: "2026-05-02T12:00:00Z",
        recoveryAt: null,
        closedAt: null,
        createdAt: "2026-05-02T08:30:00Z",
      },
    ],
  };
}

// WS-W E — per-incident uptake fixture (offers sent; accepted suppressed below k).
export function mockOrgIncidentUptake(
  _incidentId: string,
): import("./types").OrgIncidentUptake {
  return {
    status: "computed",
    k: 5,
    offersSent: 38,
    accepted: 22,
    acceptedSuppressed: false,
    note: "aggregate uptake only — individual offers/acceptances are never disclosed",
  };
}

// WS-U U6 — FieldLens observed climate fixture (κ-reliable; per-construct mean, k≥5).
export function mockOrgObservedClimate(): import("./types").OrgObservedClimate {
  return {
    status: "computed",
    k: 5,
    reliableSessions: 14,
    observed: [
      { constructCode: "voice_equity", status: "computed", sessions: 14, observedMean: 2.6 },
      { constructCode: "conflict_maturity", status: "computed", sessions: 12, observedMean: 2.9 },
      { constructCode: "decision_health", status: "suppressed", sessions: null, observedMean: null },
    ],
  };
}

// WS-O dynamic metrics — the two RICH aggregate surfaces (b2b_115–120).
export function mockClinicalQuality(_period: string): import("./types").ClinicalQuality {
  return {
    status: "computed",
    k: 5,
    membersWithFollowup: 8,
    episodesWithFollowup: 8,
    reliableImprovementRate: 62.5,
    deteriorationFlagRate: 0,
    careTrackEnrolmentsTotal: 9,
    careTrackCompleted: 6,
    careTrackCompletionRate: 66.7,
    episodesTotal: 10,
    episodesActive: 3,
    episodesDischarged: 7,
  };
}

export function mockGuardrailViolations(_period: string): import("./types").GuardrailViolations {
  return {
    status: "computed",
    periodCurr: "2026-Q2",
    periodPrev: "2026-Q1",
    violationCount: 0,
    violations: [],
  };
}
