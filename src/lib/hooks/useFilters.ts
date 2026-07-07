"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DashboardFilters } from "@/lib/graphql/types";

/**
 * URL-synced dashboard filters (period / department / level) + the active tab.
 * Keeping them in the URL makes views shareable and back/forward friendly.
 */
export interface UrlState extends DashboardFilters {
  tab: string;
}

const LEVELS = new Set(["L1", "L2", "L3"]);

export function useUrlFilters(defaultPeriod: string): {
  state: UrlState;
  setParam: (key: keyof UrlState, value: string | null) => void;
} {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const rawLevel = params.get("level");
  const state: UrlState = {
    period: params.get("period") ?? defaultPeriod,
    department: params.get("dept"),
    team: params.get("team"),
    level: rawLevel && LEVELS.has(rawLevel) ? (rawLevel as "L1" | "L2" | "L3") : null,
    tab: params.get("tab") ?? "overview",
  };

  const setParam = useCallback(
    (key: keyof UrlState, value: string | null) => {
      const next = new URLSearchParams(params.toString());
      const urlKey = key === "department" ? "dept" : key;
      if (value === null || value === "") next.delete(urlKey);
      else next.set(urlKey, value);
      router.replace(`${pathname}?${next.toString()}`, { scroll: false });
    },
    [params, pathname, router],
  );

  return { state, setParam };
}
