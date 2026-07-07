// FieldLens online-channel trust deltas (WS-U §5, b2b_300). Self-contained GraphQL
// fetch for the three cohort signals exposed by get_org_fieldlens (k≥5, l3_only).
// Kept OUT of the shared api.ts/queries.ts/types.ts so it can ship independently;
// the matching server resolver (orgFieldLens) is wired centrally — see returned
// delta. While the 3 metric_definitions ship is_active=false the resolver returns
// an empty `signals` array (the read-path gate), so this renders the "pending" state.

import { USE_MOCK } from "@/lib/env";
import { gqlRequest } from "./client";

export type FieldLensSignalKey =
  | "anonymity_delta"
  | "conformity_delta"
  | "should_would_gap";

export interface FieldLensSignal {
  signal: FieldLensSignalKey;
  departmentId: string | null;
  n: number;
  mode: "shadow" | "live";
  discount: number;
  // delta/gap (anonymity, should_would) in favourability pts, or n_signals (conformity)
  value: number | null;
}

export interface OrgFieldLens {
  period: string;
  signals: FieldLensSignal[];
}

const ORG_FIELDLENS_QUERY = /* GraphQL */ `
  query OrgFieldLens($period: String!) {
    orgFieldLens(period: $period) {
      period
      signals {
        signal
        departmentId
        n
        mode
        discount
        value
      }
    }
  }
`;

export async function getOrgFieldLens(period: string): Promise<OrgFieldLens> {
  // While the metrics are is_active=false the kernel returns no signals; mock mirrors that.
  if (USE_MOCK) return { period, signals: [] };
  const data = await gqlRequest<{ orgFieldLens: OrgFieldLens }>(ORG_FIELDLENS_QUERY, {
    period,
  });
  return data.orgFieldLens;
}
