"use client";

/**
 * E3 rollout-contrast data layer (MIOS §9 — wave-4 G2). ISOLATED, own-file companion to
 * the evidence ladder: own query string + own React-Query hook (rolloutHooks.ts), talking
 * to the shared `gqlRequest` transport (not edited). It does NOT import or modify K's
 * lib/evidence/{api,hooks}.ts or Z's lib/evidence/{ladder,ladderHooks}.ts.
 *
 * The §9 stepped-wedge contrast in the DB (RPC get_org_rollout_contrast, gateway-wired in
 * mios.resolver.ts):
 *   • get_org_rollout_contrast(org, programme, period) → the orientation-corrected
 *     treatment-arm vs control-arm after-value difference for one programme, with a
 *     two-sample normal-approx 95% CI. This is the E3 mechanism behind a Gold-rung ladder
 *     entry — it powers the evidence ladder's E3 rung and the panel's per-programme drill.
 *
 * Honest-pending until wired: if the gateway field is missing the request throws a GraphQL
 * validation error, swallowed to a `pending` envelope so callers degrade honestly. By §9
 * design the contrast is null on the replica anyway — no randomised-order rollout arms.
 */

import { gqlRequest } from "@/lib/graphql/client";

export interface RolloutContrast {
  pending: boolean; // true when the gateway field isn't wired yet
  orgId: string | null;
  programme: string | null;
  period: string | null;
  metricKey: string | null;
  higherIsBetter: boolean | null;
  contrast: number | null;
  ciLower: number | null;
  ciUpper: number | null;
  ciBasis: string | null;
  treatmentArmN: number | null;
  controlArmN: number | null;
  status: string | null;
  basis: string | null;
}

const ROLLOUT_CONTRAST_QUERY = /* GraphQL */ `
  query OrgRolloutContrast($programme: String!, $period: String) {
    orgRolloutContrast(programme: $programme, period: $period) {
      orgId
      programme
      period
      metricKey
      higherIsBetter
      contrast
      ciLower
      ciUpper
      ciBasis
      treatmentArmN
      controlArmN
      status
      basis
    }
  }
`;

const PENDING = (programme: string, period: string | null): RolloutContrast => ({
  pending: true,
  orgId: null,
  programme,
  period,
  metricKey: null,
  higherIsBetter: null,
  contrast: null,
  ciLower: null,
  ciUpper: null,
  ciBasis: null,
  treatmentArmN: null,
  controlArmN: null,
  status: null,
  basis: null,
});

/**
 * Fetch the E3 stepped-wedge contrast for one programme. If the gateway field isn't
 * present the request throws a GraphQL validation error — swallowed to a `pending`
 * envelope so callers degrade honestly. Real auth errors (GraphqlAuthError) propagate
 * to the app-wide handler.
 */
export async function fetchRolloutContrast(
  programme: string,
  period: string | null,
): Promise<RolloutContrast> {
  try {
    const data = await gqlRequest<{ orgRolloutContrast: RolloutContrast }>(
      ROLLOUT_CONTRAST_QUERY,
      { programme, period },
    );
    return { ...data.orgRolloutContrast, pending: false };
  } catch (err) {
    if (isFieldMissing(err)) return PENDING(programme, period);
    throw err;
  }
}

function isFieldMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Cannot query field|Unknown (field|type|argument)|orgRolloutContrast/i.test(msg);
}
