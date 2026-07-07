"use client";

import { useFilterOptions } from "@/lib/hooks/useDashboardData";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { Dropdown } from "@/components/ui/Dropdown";

/**
 * Compact filter cluster for the dark app bar (Period / Department / Team / Level).
 * Same URL-backed state as the body <FilterBar> (both read/write the same query
 * params via useUrlFilters, so they stay in sync), but rendered as translucent
 * dark-tone dropdowns with no text labels — the values ("2026-Q2", "All teams"…)
 * are self-describing, which keeps the bar compact. Shown on wide screens only;
 * the body FilterBar is the fallback below `xl` (see DashboardView).
 */
export function TopbarFilters({ defaultPeriod }: { defaultPeriod: string }) {
  const { data: opts } = useFilterOptions();
  const { state, setParam } = useUrlFilters(defaultPeriod);

  return (
    <div className="flex items-center gap-1.5">
      <Dropdown
        tone="dark"
        size="sm"
        openOnHover
        minWidth={96}
        value={state.period}
        onChange={(v) => setParam("period", v)}
        options={(opts?.periods ?? [defaultPeriod]).map((p) => ({ value: p, label: p }))}
      />
      <Dropdown
        tone="dark"
        size="sm"
        openOnHover
        minWidth={138}
        value={state.department ?? ""}
        onChange={(v) => setParam("department", v || null)}
        options={[
          { value: "", label: "All departments" },
          ...(opts?.departments ?? []).map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
      <Dropdown
        tone="dark"
        size="sm"
        openOnHover
        minWidth={114}
        value={state.team ?? ""}
        onChange={(v) => setParam("team", v || null)}
        options={[
          { value: "", label: "All teams" },
          ...(opts?.teams ?? []).map((t) => ({ value: t.id, label: t.label })),
        ]}
      />
      <Dropdown
        tone="dark"
        size="sm"
        openOnHover
        minWidth={108}
        value={state.level ?? ""}
        onChange={(v) => setParam("level", v || null)}
        options={[
          { value: "", label: "All levels" },
          ...(opts?.levels ?? []).map((l) => ({ value: l.id, label: l.label })),
        ]}
      />
    </div>
  );
}
