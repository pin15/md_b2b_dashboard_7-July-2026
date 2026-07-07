"use client";

import { useUrlFilters } from "@/lib/hooks/useFilters";
import { cn } from "@/lib/utils";

export const TABS = [
  { id: "overview", label: "Overview" },
  { id: "health", label: "Health & Risk" },
  { id: "engagement", label: "Engagement" },
  { id: "impact", label: "Impact" },
  { id: "verify", label: "Verify" },
  { id: "act", label: "Act & Programmes" },
  { id: "govern", label: "Reports & Govern" },
] as const;

export type TabId = (typeof TABS)[number]["id"];

export function TabNav({ defaultPeriod }: { defaultPeriod: string }) {
  const { state, setParam } = useUrlFilters(defaultPeriod);
  return (
    <div className="flex flex-wrap gap-1 border-b border-brand-border">
      {TABS.map((t) => {
        const active = state.tab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => setParam("tab", t.id)}
            className={cn(
              // B2C tab styling: navy (#1E3A5F) underline + navy label on the active
              // tab, slate-muted inactive with a navy hover. Navy is the brand
              // primary (B2C §2/§4a). Severity tones are untouched.
              "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2",
              active
                ? "border-brand-primary text-brand-primary"
                : "border-transparent text-brand-muted hover:text-brand-text",
            )}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
