"use client";

// HEALTH / North-Star metrics (WS-C C / WS-W W) — self-contained data layer for the
// two CEO headline aggregate surfaces. Mock-first: when NEXT_PUBLIC_USE_MOCK is set or
// no GraphQL URL is configured, these resolve to representative fixtures so the cards
// typecheck and render without a live API. Both back-end RPCs are k≥5-enforced in-DB,
// employer-reader gated, and aggregate-only — no individual ever appears.

import { useQuery } from "@tanstack/react-query";
import { USE_MOCK } from "@/lib/env";
import { gqlRequest } from "@/lib/graphql/client";

// ── Types (mirror the apps/api code-first ObjectTypes) ──────────────────────
export interface EngagedCoveredLives {
  period: string;
  k: number | null;
  suppressed: boolean;
  coveredLives: number | null;
  engagedLives: number | null;
  engagedRate: number | null; // 0..1 engaged/covered
}

export interface ThermoclineLayer {
  level: string; // l1 | l2 | l3
  value: number | null;
  band: string | null;
}
export interface ThermoclineBoundary {
  boundary: string; // e.g. 'l1->l2'
  retention: number | null;
  attenuation: number | null;
}
export interface Thermocline {
  period: string;
  k: number | null;
  profile: string; // computed | insufficient_layers | no_snapshot | no_org
  sourceMetric: string;
  sharpDropThreshold: number | null;
  layersPresent: number | null;
  thermoclineBoundary: string | null;
  layers: ThermoclineLayer[];
  boundaries: ThermoclineBoundary[];
}

// ── Queries ─────────────────────────────────────────────────────────────────
const ENGAGED_COVERED_LIVES_QUERY = /* GraphQL */ `
  query EngagedCoveredLives($period: String!) {
    engagedCoveredLives(period: $period) {
      period
      k
      suppressed
      coveredLives
      engagedLives
      engagedRate
    }
  }
`;

const THERMOCLINE_QUERY = /* GraphQL */ `
  query Thermocline($period: String!, $sourceMetric: String) {
    thermocline(period: $period, sourceMetric: $sourceMetric) {
      period
      k
      profile
      sourceMetric
      sharpDropThreshold
      layersPresent
      thermoclineBoundary
      layers {
        level
        value
        band
      }
      boundaries {
        boundary
        retention
        attenuation
      }
    }
  }
`;

// ── Mock fixtures (representative; k≥5 honoured) ────────────────────────────
function mockEngagedCoveredLives(period: string): EngagedCoveredLives {
  return {
    period,
    k: 5,
    suppressed: false,
    coveredLives: 55,
    engagedLives: 51,
    engagedRate: 0.9273,
  };
}

function mockThermocline(period: string, sourceMetric: string | null): Thermocline {
  return {
    period,
    k: 5,
    profile: "computed",
    sourceMetric: sourceMetric ?? "PSS_HIGH_PCT",
    sharpDropThreshold: 0.4,
    layersPresent: 3,
    thermoclineBoundary: "l2->l3",
    layers: [
      { level: "l1", value: 0.22, band: "amber" },
      { level: "l2", value: 0.18, band: "amber" },
      { level: "l3", value: 0.08, band: "green" },
    ],
    boundaries: [
      { boundary: "l1->l2", retention: 0.82, attenuation: 0.18 },
      { boundary: "l2->l3", retention: 0.44, attenuation: 0.56 },
    ],
  };
}

// ── Fetchers (mock-first) ────────────────────────────────────────────────────
export async function getEngagedCoveredLives(
  period: string,
): Promise<EngagedCoveredLives> {
  if (USE_MOCK) return mockEngagedCoveredLives(period);
  const data = await gqlRequest<{ engagedCoveredLives: EngagedCoveredLives }>(
    ENGAGED_COVERED_LIVES_QUERY,
    { period },
  );
  return data.engagedCoveredLives;
}

export async function getThermocline(
  period: string,
  sourceMetric: string | null = null,
): Promise<Thermocline> {
  if (USE_MOCK) return mockThermocline(period, sourceMetric);
  const data = await gqlRequest<{ thermocline: Thermocline }>(THERMOCLINE_QUERY, {
    period,
    sourceMetric,
  });
  return data.thermocline;
}

// ── React-Query hooks ─────────────────────────────────────────────────────────
export function useEngagedCoveredLives(period: string) {
  return useQuery({
    queryKey: ["engagedCoveredLives", period],
    queryFn: () => getEngagedCoveredLives(period),
  });
}

export function useThermocline(
  period: string,
  sourceMetric: string | null = null,
) {
  return useQuery({
    queryKey: ["thermocline", period, sourceMetric],
    queryFn: () => getThermocline(period, sourceMetric),
  });
}
