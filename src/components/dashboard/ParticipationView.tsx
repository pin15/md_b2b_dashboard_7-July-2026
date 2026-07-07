"use client";

import { FilterBar } from "@/components/dashboard/FilterBar";
import { ParticipationTable } from "@/components/dashboard/ParticipationTable";
import { MicroLabel } from "@/components/ui/panels";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import type { DashboardFilters } from "@/lib/graphql/types";

const DEFAULT_PERIOD = "2026-Q2";

/**
 * Participation Tracker page — Tier-2 (Iron Rule v2): roster BY NAME with
 * filled / not-filled status only, never an answer or a score.
 *
 * Visual language (matches the redesigned Act / Overview tabs): typography-led,
 * near-monochrome slate; navy (#1E3A5F) is the single interactive accent;
 * status colour appears only on data (dots, bar segments) — never as chrome.
 */
export function ParticipationView() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const filters: DashboardFilters = {
    period: state.period,
    department: state.department,
    level: state.level,
  };

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>Participation</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Who has — and hasn&apos;t — taken part
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          The roster by name with completion status only — never the answers or a score. This is
          the Tier-2 surface Iron Rule v2 permits the employer to see by name.
        </p>
      </header>

      <FilterBar defaultPeriod={DEFAULT_PERIOD} />

      <ParticipationTable filters={filters} />
    </div>
  );
}
