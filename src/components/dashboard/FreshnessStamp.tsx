import { Clock, AlertTriangle } from "lucide-react";
import type { Freshness } from "@/lib/graphql/types";

/**
 * "As-of / freshness" stamp on every payload (doc 12 P1-7) — so HR never reads
 * stale or empty numbers without a signal. Also surfaces the consent/contract
 * gate (`blocked_no_contract`, doc 13 P0-4) and the not-yet-computed state.
 */
export function FreshnessStamp({ freshness }: { freshness: Freshness }) {
  if (freshness.status === "blocked_no_contract") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-severity-amber">
        <AlertTriangle className="h-3.5 w-3.5" />
        Aggregation blocked — no active data-use basis for this client.
      </span>
    );
  }
  if (freshness.status === "not_yet_available" || !freshness.asOf) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
        <Clock className="h-3.5 w-3.5" />
        Not yet computed for this period.
      </span>
    );
  }
  const date = new Date(freshness.asOf);
  const label = Number.isNaN(date.getTime())
    ? freshness.asOf
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-brand-muted">
      <Clock className="h-3.5 w-3.5" />
      As of {label}
      {freshness.status === "stale" && (
        <span className="ml-1 text-severity-amber">· stale</span>
      )}
    </span>
  );
}
