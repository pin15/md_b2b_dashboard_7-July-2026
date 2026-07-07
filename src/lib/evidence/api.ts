"use client";

/**
 * Evidence / Outcomes surface — isolated data layer (MIOS §9, b2b_295).
 *
 * This is an OWN-FILES module for the Evidence/Outcomes dashboard surface. It is
 * deliberately self-contained: it talks to the GraphQL gateway via the shared
 * `gqlRequest` transport (not edited), with its OWN query strings, so it does not
 * depend on (or modify) the shared `@/lib/graphql/{api,queries,types}` modules.
 *
 * The §9 spine in the DB (migration b2b_295):
 *   • get_org_impact_verdict(org, product_line, period) → Scale/Fix/Hold/Retire
 *   • get_org_repeat_lesson_rate(org)                  → learning-library hygiene
 *   • kill_review / outcomes_ledger / learning_library  (employer-blind aggregate tables)
 *
 * GATEWAY DEPENDENCY (honest-pending until wired): the verdict + repeat-lesson-rate
 * RPCs need a thin resolver+schema field in the apps/api gateway (proof.resolver.ts /
 * schema.gql) — RETURNED as an off-limits delta with this task, NOT edited here. Until
 * that field ships, `fetchImpactVerdict` / `fetchRepeatLessonRate` resolve to a
 * `pending` envelope so the surface renders honestly (and, by §9 design, verdict
 * numbers stay null on the replica anyway — no real spend, one published snapshot).
 */

import { gqlRequest } from "@/lib/graphql/client";

// ── shapes (mirror the RPC JSON; own types, not the shared graphql/types) ──────────
export type ImpactVerdict = "scale" | "fix" | "hold" | "retire";

export interface ImpactVerdictRow {
  interventionId: string | null;
  catalogueKey: string;
  interventionName: string;
  productLine: string | null;
  targetMetricKey: string | null;
  status: string | null;
  delta: number | null;
  direction: string | null;
  cohortN: number | null;
  costPerOutcome: number | null;
  reliableOutcomes: number | null;
  verdict: ImpactVerdict;
  verdictBasis: string;
}

export interface ImpactVerdictResult {
  pending: boolean;          // true when the gateway field isn't wired yet
  rows: ImpactVerdictRow[];
  productLine: string | null;
  period: string | null;
}

export interface RepeatLessonRate {
  pending: boolean;
  distinctLessons: number | null;
  repeatedLessons: number | null;
  repeatLessonRate: number | null; // null on an empty library
}

// ── GraphQL documents (own strings; field names are the PROPOSED gateway fields) ────
const IMPACT_VERDICT_QUERY = /* GraphQL */ `
  query OrgImpactVerdict($productLine: String, $period: String!) {
    orgImpactVerdict(productLine: $productLine, period: $period) {
      productLine
      period
      rows {
        interventionId
        catalogueKey
        interventionName
        productLine
        targetMetricKey
        status
        delta
        direction
        cohortN
        costPerOutcome
        reliableOutcomes
        verdict
        verdictBasis
      }
    }
  }
`;

const REPEAT_LESSON_RATE_QUERY = /* GraphQL */ `
  query OrgRepeatLessonRate {
    orgRepeatLessonRate {
      distinctLessons
      repeatedLessons
      repeatLessonRate
    }
  }
`;

/**
 * Fetch the 4-state Impact P&L verdict. If the gateway field is not yet present the
 * request throws a GraphQL validation error — we swallow it to a `pending` envelope so
 * the surface degrades honestly rather than crashing. (Any real auth error from
 * gqlRequest — GraphqlAuthError — is left to propagate to the app-wide handler.)
 */
export async function fetchImpactVerdict(
  period: string,
  productLine: string | null,
): Promise<ImpactVerdictResult> {
  try {
    const data = await gqlRequest<{ orgImpactVerdict: ImpactVerdictResult }>(
      IMPACT_VERDICT_QUERY,
      { period, productLine },
    );
    return { ...data.orgImpactVerdict, pending: false };
  } catch (err) {
    if (isFieldMissing(err)) return { pending: true, rows: [], productLine, period };
    throw err;
  }
}

export async function fetchRepeatLessonRate(): Promise<RepeatLessonRate> {
  try {
    const data = await gqlRequest<{ orgRepeatLessonRate: RepeatLessonRate }>(
      REPEAT_LESSON_RATE_QUERY,
    );
    return { ...data.orgRepeatLessonRate, pending: false };
  } catch (err) {
    if (isFieldMissing(err))
      return { pending: true, distinctLessons: null, repeatedLessons: null, repeatLessonRate: null };
    throw err;
  }
}

/** A GraphQL "Cannot query field" / "unknown field" validation error → gateway not wired. */
function isFieldMissing(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return /Cannot query field|Unknown (field|type|argument)|orgImpactVerdict|orgRepeatLessonRate/i.test(
    msg,
  );
}
