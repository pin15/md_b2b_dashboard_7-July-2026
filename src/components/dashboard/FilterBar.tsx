"use client";

import { useFilterOptions } from "@/lib/hooks/useDashboardData";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { Dropdown } from "@/components/ui/Dropdown";

function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-brand-muted">{label}</span>
      <Dropdown value={value} onChange={onChange} options={options} minWidth={150} />
    </label>
  );
}

export function FilterBar({ defaultPeriod }: { defaultPeriod: string }) {
  const { data: opts } = useFilterOptions();
  const { state, setParam } = useUrlFilters(defaultPeriod);

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-brand-surface px-5 py-3.5 shadow-card transition-shadow duration-300 hover:shadow-card-hover">
      <Field
        label="Period"
        value={state.period}
        onChange={(v) => setParam("period", v)}
        options={(opts?.periods ?? [defaultPeriod]).map((p) => ({ value: p, label: p }))}
      />
      <Field
        label="Department"
        value={state.department ?? ""}
        onChange={(v) => setParam("department", v || null)}
        options={[
          { value: "", label: "All departments" },
          ...(opts?.departments ?? []).map((d) => ({ value: d.id, label: d.label })),
        ]}
      />
      <Field
        label="Team"
        value={state.team ?? ""}
        onChange={(v) => setParam("team", v || null)}
        options={[
          { value: "", label: "All teams" },
          ...(opts?.teams ?? []).map((t) => ({ value: t.id, label: t.label })),
        ]}
      />
      <Field
        label="Level"
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
