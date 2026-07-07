"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOverview,
  getParticipation,
  getFilterOptions,
  getBranding,
  getMetricCells,
  getOrgRoi,
  getDataConfidence,
  getTeamHome,
  getMetricTrend,
  getOrgInsights,
  getOrgQuadrant,
  getVerifyLedger,
  getOrgInterventionRecommendations,
  getOrgInterventions,
  bookOrgIntervention,
  getOrgEsgDisclosure,
  getOrgCertification,
  getOrgCommitteeTracker,
  getOrgPrivacyKri,
  getOrgCareEngagement,
  getOrgAcademyCompletion,
  getOrgCohortProgress,
  getOrgCertPassrate,
  getExecTeamPsafety,
  getQbrAnnotations,
  upsertQbrAnnotation,
  getOrgCoachingSummary,
  getOrgWorkshopSummary,
  getOrgMhfaCoverage,
  getOrgSelfcareEngagement,
  getOrgLifeInviteSummary,
  getOrgBridgeSummary,
  getOrgIncidents,
  getOrgIncidentUptake,
  getOrgObservedClimate,
  getClinicalQuality,
  getGuardrailViolations,
  getOrgRoster,
  provisionOrgMembers,
  getPendingInvites,
  resendInvite,
  revokeInvite,
  sendInvite,
  sendAllPendingInvites,
} from "@/lib/graphql/api";
import { getOrgFamilyCoverage, getOrgBrandingProfile, getOrgCostPerOutcome, getOrgUnderperformingInterventions } from "@/lib/graphql/api";
import { getOrgRating, getRecoveryYield, getDecisionCost, getValidityTier, getParticipationDiagnosis } from "@/lib/graphql/api";
import { getOrgBenchmarkDelta, getOrgSectorPack, getManager360 } from "@/lib/graphql/api";
import type {
  DashboardFilters,
  MetricKey,
  Grain,
  ProvisionMemberInput,
  BookInterventionInput,
  UpsertQbrAnnotationInput,
} from "@/lib/graphql/types";

const keyOf = (f: DashboardFilters) =>
  [f.period, f.department ?? "all", f.team ?? "all", f.level ?? "all"] as const;

export function useOverview(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["overview", ...keyOf(filters)],
    queryFn: () => getOverview(filters),
  });
}

export function useParticipation(filters: DashboardFilters) {
  return useQuery({
    queryKey: ["participation", ...keyOf(filters)],
    queryFn: () => getParticipation(filters),
  });
}

export function useMetricCells(metric: MetricKey, grain: Grain, period: string) {
  return useQuery({
    queryKey: ["metricCells", metric, grain, period],
    queryFn: () => getMetricCells(metric, grain, period),
  });
}

export function useOrgRoi(period: string) {
  return useQuery({
    queryKey: ["orgRoi", period],
    queryFn: () => getOrgRoi(period),
  });
}

export function useDataConfidence(period: string) {
  return useQuery({
    queryKey: ["dataConfidence", period],
    queryFn: () => getDataConfidence(period),
  });
}

export function useTeamHome(period: string) {
  return useQuery({
    queryKey: ["teamHome", period],
    queryFn: () => getTeamHome(period),
  });
}

export function useManager360() {
  return useQuery({
    queryKey: ["manager360"],
    queryFn: () => getManager360(),
  });
}

export function useMetricTrend(metric: MetricKey) {
  return useQuery({
    queryKey: ["metricTrend", metric],
    queryFn: () => getMetricTrend(metric),
  });
}

export function useOrgInsights(period: string) {
  return useQuery({
    queryKey: ["orgInsights", period],
    queryFn: () => getOrgInsights(period),
  });
}

export function useOrgQuadrant(period: string, grain: Grain = "DEPARTMENT") {
  return useQuery({
    queryKey: ["orgQuadrant", period, grain],
    queryFn: () => getOrgQuadrant(period, grain),
  });
}

export function useVerifyLedger(period: string) {
  return useQuery({
    queryKey: ["verifyLedger", period],
    queryFn: () => getVerifyLedger(period),
  });
}

export function useOrgInterventionRecommendations(period: string) {
  return useQuery({
    queryKey: ["orgInterventionRecommendations", period],
    queryFn: () => getOrgInterventionRecommendations(period),
  });
}

export function useOrgInterventions() {
  return useQuery({
    queryKey: ["orgInterventions"],
    queryFn: getOrgInterventions,
  });
}

export function useBookOrgIntervention() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: BookInterventionInput) => bookOrgIntervention(input),
    onSuccess: () => {
      // a freshly-booked programme leaves the recommendation rail and joins the board.
      qc.invalidateQueries({ queryKey: ["orgInterventions"] });
      qc.invalidateQueries({ queryKey: ["orgInterventionRecommendations"] });
      // and shows up on the GOVERN committee tracker (same org_interventions source).
      qc.invalidateQueries({ queryKey: ["orgCommitteeTracker"] });
    },
  });
}

// ── WS-L GOVERN hooks ───────────────────────────────────────────────────────
export function useOrgEsgDisclosure(period: string) {
  return useQuery({
    queryKey: ["orgEsgDisclosure", period],
    queryFn: () => getOrgEsgDisclosure(period),
  });
}

export function useOrgCertification(period: string) {
  return useQuery({
    queryKey: ["orgCertification", period],
    queryFn: () => getOrgCertification(period),
  });
}

export function useOrgCommitteeTracker() {
  return useQuery({
    queryKey: ["orgCommitteeTracker"],
    queryFn: getOrgCommitteeTracker,
  });
}

export function useOrgPrivacyKri() {
  return useQuery({
    queryKey: ["orgPrivacyKri"],
    queryFn: getOrgPrivacyKri,
  });
}

// ── WS-L RESIDUALS hooks (b2b_77) ───────────────────────────────────────────
export function useOrgCareEngagement(period: string) {
  return useQuery({
    queryKey: ["orgCareEngagement", period],
    queryFn: () => getOrgCareEngagement(period),
  });
}

export function useExecTeamPsafety(period: string) {
  return useQuery({
    queryKey: ["execTeamPsafety", period],
    queryFn: () => getExecTeamPsafety(period),
  });
}

// WS-U U0 — Manager Academy AGGREGATE completion (k≥5). For L3/HR lenses only.
export function useOrgAcademyCompletion(period: string) {
  return useQuery({
    queryKey: ["orgAcademyCompletion", period],
    queryFn: () => getOrgAcademyCompletion(period),
  });
}

// WS-U U2 — Blended-cohort AGGREGATE progress (k≥5). For L3/HR lenses only.
export function useOrgCohortProgress(cohortCode: string | null = null) {
  return useQuery({
    queryKey: ["orgCohortProgress", cohortCode],
    queryFn: () => getOrgCohortProgress(cohortCode),
  });
}

// WS-U U3 — Certification pass-rate AGGREGATE (k≥5). For L3/HR lenses only.
export function useOrgCertPassrate(courseCode: string | null = null) {
  return useQuery({
    queryKey: ["orgCertPassrate", courseCode],
    queryFn: () => getOrgCertPassrate(courseCode),
  });
}

export function useQbrAnnotations(period: string) {
  return useQuery({
    queryKey: ["qbrAnnotations", period],
    queryFn: () => getQbrAnnotations(period),
  });
}

export function useUpsertQbrAnnotation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertQbrAnnotationInput) => upsertQbrAnnotation(input),
    onSuccess: (_res, input) => {
      qc.invalidateQueries({ queryKey: ["qbrAnnotations", input.period] });
    },
  });
}

// ── WS-R Coaching · Workshops · Training EMPLOYER AGGREGATES (Pillars C/D) ──
export function useOrgCoachingSummary(period: string) {
  return useQuery({
    queryKey: ["orgCoachingSummary", period],
    queryFn: () => getOrgCoachingSummary(period),
  });
}

export function useOrgWorkshopSummary(period: string) {
  return useQuery({
    queryKey: ["orgWorkshopSummary", period],
    queryFn: () => getOrgWorkshopSummary(period),
  });
}

export function useOrgMhfaCoverage() {
  return useQuery({
    queryKey: ["orgMhfaCoverage"],
    queryFn: getOrgMhfaCoverage,
  });
}

// ── PHASE-2 lifecycle / care / incident AGGREGATES (WS-S/T/W/U U6) ──
export function useOrgSelfcareEngagement(period: string | null = null) {
  return useQuery({
    queryKey: ["orgSelfcareEngagement", period ?? "last_30d"],
    queryFn: () => getOrgSelfcareEngagement(period),
  });
}

export function useOrgLifeInviteSummary() {
  return useQuery({
    queryKey: ["orgLifeInviteSummary"],
    queryFn: getOrgLifeInviteSummary,
  });
}

export function useOrgBridgeSummary() {
  return useQuery({
    queryKey: ["orgBridgeSummary"],
    queryFn: getOrgBridgeSummary,
  });
}

export function useOrgIncidents() {
  return useQuery({
    queryKey: ["orgIncidents"],
    queryFn: getOrgIncidents,
  });
}

export function useOrgIncidentUptake(incidentId: string | null) {
  return useQuery({
    queryKey: ["orgIncidentUptake", incidentId],
    queryFn: () => getOrgIncidentUptake(incidentId as string),
    enabled: !!incidentId,
  });
}

export function useOrgObservedClimate() {
  return useQuery({
    queryKey: ["orgObservedClimate"],
    queryFn: getOrgObservedClimate,
  });
}

// ── WS-O dynamic metrics — the two RICH aggregate surfaces (b2b_115–120) ──
export function useClinicalQuality(period: string) {
  return useQuery({
    queryKey: ["clinicalQuality", period],
    queryFn: () => getClinicalQuality(period),
  });
}

export function useGuardrailViolations(period: string) {
  return useQuery({
    queryKey: ["guardrailViolations", period],
    queryFn: () => getGuardrailViolations(period),
  });
}

export function useFilterOptions() {
  return useQuery({
    queryKey: ["filterOptions"],
    queryFn: getFilterOptions,
  });
}

export function useBranding() {
  return useQuery({
    queryKey: ["branding"],
    queryFn: getBranding,
  });
}

export function useOrgRoster() {
  return useQuery({
    queryKey: ["orgRoster"],
    queryFn: getOrgRoster,
  });
}

export function useProvisionMembers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rows: ProvisionMemberInput[]) => provisionOrgMembers(rows),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgRoster"] });
      qc.invalidateQueries({ queryKey: ["participation"] });
      qc.invalidateQueries({ queryKey: ["pendingInvites"] });
    },
  });
}

export function usePendingInvites() {
  return useQuery({
    queryKey: ["pendingInvites"],
    queryFn: getPendingInvites,
  });
}

function useInviteAction<T>(fn: (arg: T) => unknown) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (arg: T) => fn(arg) as Promise<unknown>,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgRoster"] });
      qc.invalidateQueries({ queryKey: ["pendingInvites"] });
    },
  });
}

export function useResendInvite() {
  return useInviteAction((memberId: string) => resendInvite(memberId));
}

export function useRevokeInvite() {
  return useInviteAction((memberId: string) => revokeInvite(memberId));
}

export function useSendInvite() {
  return useInviteAction((memberId: string) => sendInvite(memberId));
}

export function useSendAllPendingInvites() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => sendAllPendingInvites(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orgRoster"] });
      qc.invalidateQueries({ queryKey: ["pendingInvites"] });
    },
  });
}


// ── b2b_280/282/283 surfacing hooks ──
export function useOrgFamilyCoverage() { return useQuery({ queryKey: ["orgFamilyCoverage"], queryFn: getOrgFamilyCoverage }); }
export function useOrgBrandingProfile() { return useQuery({ queryKey: ["orgBrandingProfile"], queryFn: getOrgBrandingProfile }); }
export function useOrgCostPerOutcome(period: string) { return useQuery({ queryKey: ["orgCostPerOutcome", period], queryFn: () => getOrgCostPerOutcome(period) }); }
export function useOrgUnderperformingInterventions() { return useQuery({ queryKey: ["orgUnderperformingInterventions"], queryFn: getOrgUnderperformingInterventions }); }

// ── G4 risk & impact (b2b_305/309/314) ──
export function useOrgRating(period: string) { return useQuery({ queryKey: ["orgRating", period], queryFn: () => getOrgRating(period) }); }
export function useRecoveryYield() { return useQuery({ queryKey: ["recoveryYield"], queryFn: getRecoveryYield }); }
export function useDecisionCost() { return useQuery({ queryKey: ["decisionCost"], queryFn: getDecisionCost }); }
export function useValidityTier(period: string) { return useQuery({ queryKey: ["validityTier", period], queryFn: () => getValidityTier(period) }); }
export function useOrgBenchmarkDelta(metric: string, period: string) { return useQuery({ queryKey: ["orgBenchmarkDelta", metric, period], queryFn: () => getOrgBenchmarkDelta(metric, period) }); }
export function useOrgSectorPack() { return useQuery({ queryKey: ["orgSectorPack"], queryFn: () => getOrgSectorPack() }); }
export function useParticipationDiagnosis(period: string) { return useQuery({ queryKey: ["participationDiagnosis", period], queryFn: () => getParticipationDiagnosis(period) }); }
