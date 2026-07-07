/**
 * WS-G ORDI (Observed–Reported Divergence Index) — isolated data module.
 *
 * The FieldLens "killer cell": the REPORTED self-report PSYCH_SAFETY favourability
 * (Edmondson, 0–100) joined against the OBSERVED κ≥0.70-reliable FieldLens behavioural
 * cell (voice equity / blame-free / conflict maturity / decision health), both on a
 * common 0–100 scale. The danger pattern is "reported-HIGH / observed-LOW": a team that
 * SAYS it is safe but BEHAVES otherwise — the quantified candour/trust deficit.
 *
 * Backend: the single employer-blind, k≥5 kernel RPC get_org_ordi(org, period) (b2b_291).
 * Reads ONLY the two existing aggregate kernels (get_org_metric_snapshot PSYCH_SAFETY +
 * get_org_observed_climate). NEVER an individual or a named team. This module is fully
 * self-contained (own query doc + mock) so it touches no shared graphql file.
 */
import { USE_MOCK } from "@/lib/env";
import { gqlRequest } from "@/lib/graphql/client";

export interface OrdiCell {
  constructCode: string;
  constructName: string;
  status: string; // 'computed' | 'suppressed'
  sessions: number | null;
  observedMean: number | null; // raw 0–4 (favourability-keyed)
  observedNorm: number | null; // 0–100
  reported: number | null; // 0–100 (same reported cell for all constructs)
  divergenceDelta: number | null; // reported − observedNorm; positive = says-better-than-behaves
  reportedHighObservedLow: boolean;
}

export interface OrgOrdi {
  status: string; // 'computed' | 'reported_pending' | 'observed_pending' | 'no_org'
  k: number | null;
  period: string | null;
  reported: { metricKey: string; value: number; band: string | null; n: number | null } | null;
  reliableSessions: number | null;
  cells: OrdiCell[];
  anyReportedHighObservedLow: boolean;
  worstDivergenceConstruct: string | null;
  worstDivergenceDelta: number | null;
}

export const ORG_ORDI_QUERY = /* GraphQL */ `
  query OrgOrdi($period: String) {
    orgOrdi(period: $period) {
      status k period reliableSessions anyReportedHighObservedLow worstDivergenceConstruct worstDivergenceDelta
      reported { metricKey value band n }
      cells { constructCode constructName status sessions observedMean observedNorm reported divergenceDelta reportedHighObservedLow }
    }
  }
`;

export function mockOrgOrdi(): OrgOrdi {
  // reported PSYCH_SAFETY high (72) but observed behaviour low → the killer cell.
  return {
    status: "computed",
    k: 5,
    period: null,
    reported: { metricKey: "PSYCH_SAFETY", value: 72, band: "favourable", n: 84 },
    reliableSessions: 14,
    cells: [
      {
        constructCode: "voice_equity",
        constructName: "Voice equity",
        status: "computed",
        sessions: 14,
        observedMean: 1.8,
        observedNorm: 45,
        reported: 72,
        divergenceDelta: 27,
        reportedHighObservedLow: true,
      },
      {
        constructCode: "conflict_maturity",
        constructName: "Conflict maturity",
        status: "computed",
        sessions: 12,
        observedMean: 2.9,
        observedNorm: 72.5,
        reported: 72,
        divergenceDelta: -0.5,
        reportedHighObservedLow: false,
      },
      {
        constructCode: "decision_health",
        constructName: "Decision health",
        status: "suppressed",
        sessions: null,
        observedMean: null,
        observedNorm: null,
        reported: null,
        divergenceDelta: null,
        reportedHighObservedLow: false,
      },
    ],
    anyReportedHighObservedLow: true,
    worstDivergenceConstruct: "voice_equity",
    worstDivergenceDelta: 27,
  };
}

/** FieldLens ORDI — observed-vs-reported divergence (k≥5; κ≥0.70-reliable observed). */
export async function getOrgOrdi(period: string | null = null): Promise<OrgOrdi> {
  if (USE_MOCK) return mockOrgOrdi();
  const data = await gqlRequest<{ orgOrdi: OrgOrdi }>(ORG_ORDI_QUERY, { period });
  return data.orgOrdi;
}
