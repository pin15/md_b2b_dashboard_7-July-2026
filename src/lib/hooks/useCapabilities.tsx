"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { gqlRequest } from "@/lib/graphql/client";

/**
 * Per-org feature entitlements (b2b_350). Fetches the resolved enabled capability
 * ids (`tab:*` / `module:*` / `metric:*`) from apps/api's `orgCapabilities` query
 * — the same set md-admin's Feature control panel writes. The dashboard gates its
 * tabs/cards on this, and the guide filters its sections from it, so what an admin
 * disables for a company disappears from BOTH, and they can't drift.
 *
 * While the set is still loading we return `has() = true` (show everything), so
 * content never flash-hides before entitlements arrive.
 */
export function useCapabilities(): {
  enabled: Set<string> | undefined;
  has: (id: string) => boolean;
  isLoading: boolean;
} {
  const q = useQuery({
    queryKey: ["orgCapabilities"],
    queryFn: async () => {
      const d = await gqlRequest<{ orgCapabilities: string[] }>(`query{ orgCapabilities }`);
      return new Set(d.orgCapabilities ?? []);
    },
    staleTime: 5 * 60_000,
    retry: 1,
  });
  const enabled = q.data;
  const has = (id: string) => (enabled ? enabled.has(id) : true);
  return { enabled, has, isLoading: q.isLoading };
}

/** Render children only if the capability is enabled for this org. */
export function Gate({ cap, children }: { cap: string; children: ReactNode }) {
  const { has } = useCapabilities();
  if (!has(cap)) return null;
  return <>{children}</>;
}
