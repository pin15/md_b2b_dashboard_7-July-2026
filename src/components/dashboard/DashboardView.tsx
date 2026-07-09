"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { TabNav } from "@/components/dashboard/Tabs";
import { DataConfidenceStrip } from "@/components/dashboard/DataConfidenceStrip";
import { OverviewTab } from "@/components/dashboard/tabs/OverviewTab";
import { HealthRiskTab } from "@/components/dashboard/tabs/HealthRiskTab";
import { EngagementTab } from "@/components/dashboard/tabs/EngagementTab";
import { ImpactTab } from "@/components/dashboard/tabs/ImpactTab";
import { VerifyTab } from "@/components/dashboard/tabs/VerifyTab";
import { ActTab } from "@/components/dashboard/tabs/ActTab";
import { GovernTab } from "@/components/dashboard/tabs/GovernTab";
import { Heartbeat } from "@phosphor-icons/react";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { useCapabilities } from "@/lib/hooks/useCapabilities";
import type { DashboardFilters } from "@/lib/graphql/types";

const DEFAULT_PERIOD = "2026-Q2";

export function DashboardView() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const { has } = useCapabilities();
  const tabOn = (id: string) => state.tab === id && has(`tab:${id}`);
  const filters: DashboardFilters = {
    period: state.period,
    department: state.department,
    level: state.level,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-brand-text">
            Employer Wellbeing Dashboard
          </h1>
          <p className="text-sm text-brand-muted">
            Aggregate insight (k≥5) — no individual responses, scores, or risk.
          </p>
        </div>
        <a
          href={`/report?period=${filters.period}`}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#1E3A5F] px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-all duration-200 hover:bg-[#162d4a] hover:shadow-card-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A5F] focus-visible:ring-offset-2"
        >
          <Heartbeat weight="duotone" className="h-[18px] w-[18px] text-white/90" />
          Health Report
        </a>
      </div>

      {/* Filters move into the app bar on xl+ (see AppShell); this is the body
          fallback for smaller screens where the bar has no room. */}
      <div className="xl:hidden">
        <FilterBar defaultPeriod={DEFAULT_PERIOD} />
      </div>
      {state.tab === "health" && has("tab:health") && has("module:confidence") && (
        <DataConfidenceStrip period={filters.period} />
      )}
      {/* Tabs live in the sidebar rail on md+; this is the phone fallback (rail hidden). */}
      <div className="md:hidden">
        <TabNav defaultPeriod={DEFAULT_PERIOD} />
      </div>

      {tabOn("overview") && <OverviewTab filters={filters} />}
      {tabOn("health") && <HealthRiskTab filters={filters} />}
      {tabOn("engagement") && <EngagementTab filters={filters} />}
      {tabOn("impact") && <ImpactTab filters={filters} />}
      {tabOn("verify") && <VerifyTab filters={filters} />}
      {tabOn("act") && <ActTab filters={filters} />}
      {tabOn("govern") && <GovernTab filters={filters} />}
    </div>
  );
}
