"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useBranding } from "@/lib/hooks/useDashboardData";
import type { OrgBranding } from "@/lib/graphql/types";

/**
 * Per-org branding (doc 02 §5 / doc 04). Applies `org_branding` (logo, primary/
 * accent, display name) to the CHROME only, via Tailwind CSS variables on a
 * wrapping element. It overrides ONLY --brand-* tokens — never the fixed
 * data-severity tokens (an org's colour must not recolour a severity band,
 * doc 10 §2.1).
 *
 * Tenant = the logged-in user's organization_id from the JWT (D-2 recommended
 * v1). TODO(QA-D-2): per-org subdomain/custom-domain resolution is a later add.
 */

const BrandingContext = createContext<OrgBranding | null>(null);

export function useOrgBranding(): OrgBranding | null {
  return useContext(BrandingContext);
}

export function OrgBrandingProvider({ children }: { children: ReactNode }) {
  const { data: branding } = useBranding();

  return (
    <BrandingContext.Provider value={branding ?? null}>
      <div className="contents">{children}</div>
    </BrandingContext.Provider>
  );
}
