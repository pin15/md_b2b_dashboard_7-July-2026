"use client";

import { useOrgSelfcareEngagement } from "@/lib/hooks/useDashboardData";
import { WidgetShell, type UniversalState } from "@/components/dashboard/WidgetState";

const SURFACE_LABEL: Record<string, string> = {
  programmes: "Self-guided programmes",
  mindfulness: "Mindfulness library",
  journal: "Mood journal",
  habits: "Habits",
  nudges: "Nudges",
  resources: "Resource hub",
};

/**
 * WS-S F0 — org self-care engagement (k≥5 AGGREGATE, engagement-only). Reads ONLY
 * get_org_selfcare_engagement: covered lives + distinct active engagers + per-surface
 * counts (each surface suppressed below k). It is ENGAGEMENT, never an OUTCOME and
 * never an individual — outcome is measured separately (§F0.5). Honest-or-pending:
 * below the privacy floor it renders the suppressed dignity card.
 */
export function SelfcareEngagementCard({ period }: { period?: string | null }) {
  const { data, isLoading } = useOrgSelfcareEngagement(period ?? null);

  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Self-care engagement" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat label="Active people (30d)" value={data.activeEngagers} />
            <Stat label="Covered lives" value={data.coveredLives} />
          </div>
          {data.bySurface.length > 0 && (
            <div className="mt-3">
              <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">By surface</span>
              <div className="mt-2 space-y-1.5">
                {data.bySurface.map((s) => (
                  <div key={s.surface} className="flex items-center justify-between text-sm">
                    <span className="text-brand-text">{SURFACE_LABEL[s.surface] ?? s.surface}</span>
                    <span className="tabular-nums text-brand-muted">
                      {s.members} people · {s.events} times
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mt-3 text-xs text-brand-muted">
            Engagement only — never an individual, and never confused with an outcome (measured separately). Group
            aggregates at k≥{data.k ?? 5}.
          </p>
        </>
      )}
    </WidgetShell>
  );
}

function Stat({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-brand-muted">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value ?? "—"}</span>
    </div>
  );
}
