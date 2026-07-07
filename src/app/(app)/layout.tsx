import { OrgBrandingProvider } from "@/components/branding/OrgBrandingProvider";
import { AppShell } from "@/components/layout/AppShell";

/**
 * Authenticated app shell. Route gating (authed + AAL2 + employer org) is done
 * in middleware.ts (the UX gate) and, authoritatively, by apps/api's AuthGuard.
 * This layout applies per-org branding and the nav chrome.
 */
export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OrgBrandingProvider>
      <AppShell>{children}</AppShell>
    </OrgBrandingProvider>
  );
}
