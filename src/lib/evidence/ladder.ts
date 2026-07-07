"use client";

/**
 * Evidence-ladder data layer (MIOS §9, migration b2b_310 — Task Z). ISOLATED from K's
 * lib/evidence/{api,hooks}.ts: own query strings + own React-Query hook, talking to the
 * shared `gqlRequest` transport (not edited). It does NOT import or modify K's modules.
 *
 * The §9 evidence ladder in the DB (migration b2b_310):
 *   • get_org_evidence_ladder(org, period)            → each programme's best rung E0..E5
 *   • compute_evidence_record(org, intervention, …)   → computes E1 (pre/post) + E2 (matched)
 *   • get_org_rollout_contrast(org, programme, period) → E3 stepped-wedge treatment vs control
 *
 * GATEWAY DEPENDENCY (honest-pending until wired): these RPCs need thin resolver+schema
 * fields in the apps/api gateway — RETURNED as an off-limits delta with this task, NOT
 * edited here. Until those fields ship, `fetchEvidenceLadder` resolves to a `pending`
 * envelope so the panel renders honestly. By §9 design the rungs are E0/null on the
 * replica anyway (one published snapshot, no sibling cohorts, no rollout arms).
 */

import { gqlRequest } from "@/lib/graphql/client";

export type EvidenceLevel = "e0" | "e1" | "e2" | "e3" | "e4" | "e5";

export interface EvidenceLadderRow {
  evidenceRecordId: string | null;
  catalogueKey: string | null;
  interventionId: string | null;
  productLine: string | null;
  targetMetricKey: string | null;
  period: string | null;
  level: EvidenceLevel;
  design: string | null;
  effectSize: number | null;
  effectUnit: string | null;
  ciLower: number | null;
  ciUpper: number | null;
  ciBasis: string | null;
  treatmentN: number | null;
  comparisonN: number | null;
  basis: string | null;
}

export interface EvidenceLadderResult {
  pending: boolean; // true when the gateway field isn't wired yet
  rows: EvidenceLadderRow[];
  ladderLegend: Record<EvidenceLevel, string> | null;
  period: string | null;
}

const EVIDENCE_LADDER_QUERY = /* GraphQL */ `
  query OrgEvidenceLadder($period: String) {
    orgEvidenceLadder(period: $period) {
      period
      ladderLegend {
        e0
        e1
        e2
        e3
        e4
        e5
      }
      rows {
        evidenceRecordId
        catalogueKey
        interventionId
        productLine
        targetMetricKey
        period
        level
        design
        effectSize
        effectUnit
        ciLower
        ciUpper
        ciBasis
        treatmentN
        comparisonN
        basis
      }
    }
  }
`;

/**
 * Fetch the evidence ladder. If the gateway field isn't present the request throws a
 * GraphQL validation error — swallowed to a `pending` envelope so the panel degrades
 * honestly. Real auth errors (GraphqlAuthError) propagate to the app-wide handler.
 */
export async function fetchEvidenceLadder(
  period: string | null,
): Promise<EvidenceLadderResult> {
  try {
    const data = await gqlRequest<{ orgEvidenceLadder: EvidenceLadderResult }>(
      EVIDENCE_LADDER_QUERY,
      { period },
    );
    return { ...data.orgEvidenceLadder, pending: false };
  } catch (err) {
    if (isFieldMissing(err))
      return { pending: true, rows: [], ladderLegend: null, period };
    throw err;
  }
}

function isFieldMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Cannot query field|Unknown (field|type|argument)|orgEvidenceLadder/i.test(msg);
}
