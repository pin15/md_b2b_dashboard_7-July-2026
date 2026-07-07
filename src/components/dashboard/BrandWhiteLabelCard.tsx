"use client";

import { Card, CardTitle, Badge, Skeleton } from "@/components/ui/primitives";
import { useOrgBrandingProfile } from "@/lib/hooks/useDashboardData";
import { Palette } from "lucide-react";

/**
 * Brand & white-label (b2b_282) — Reports & Govern tab. Surfaces the org's stored
 * branding profile (public.get_org_branding via the orgBrandingProfile query): the
 * display name, a logo preview (when logo_url is set), and the primary/accent colour
 * swatches. When nothing is configured yet it shows an honest empty state pointing
 * the org admin to the admin portal — never a fabricated brand.
 *
 * Read-only here. The dashboard HEADER could later consume displayName/primaryColor
 * from this same hook for true white-label chrome (see integration note (f)).
 */

// A configured row has at least one non-null branding attribute.
function isConfigured(b: {
  displayName: string | null;
  logoUrl: string | null;
  primaryColor: string | null;
  accentColor: string | null;
}): boolean {
  return !!(b.displayName || b.logoUrl || b.primaryColor || b.accentColor);
}

function fmtUpdated(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function BrandWhiteLabelCard() {
  const { data, isLoading } = useOrgBrandingProfile();

  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;

  const configured = data ? isConfigured(data) : false;
  const updated = fmtUpdated(data?.updatedAt ?? null);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-brand-muted" />
          <CardTitle>Brand &amp; white-label</CardTitle>
        </div>
        <Badge color="var(--brand-muted)">{configured ? "configured" : "not set"}</Badge>
      </div>

      {!data || !configured ? (
        <div className="py-6 text-center">
          <p className="mx-auto max-w-md text-xs text-brand-muted">
            Not yet configured — set your organisation&apos;s display name, logo and brand
            colours in the admin portal. Once saved they appear here and can drive the
            dashboard&apos;s white-label chrome.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Logo preview + display name */}
          <div className="flex items-center gap-3">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.logoUrl}
                alt={`${data.displayName ?? "Organisation"} logo`}
                className="h-12 w-12 rounded-lg bg-brand-bg object-contain p-1"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-bg text-[10px] text-brand-muted">
                no logo
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-brand-text">
                {data.displayName ?? "—"}
              </span>
              <span className="text-[11px] text-brand-muted">display name</span>
            </div>
          </div>

          {/* Colour swatches */}
          <div className="grid grid-cols-2 gap-3">
            <Swatch label="Primary" value={data.primaryColor} />
            <Swatch label="Accent" value={data.accentColor} />
          </div>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        White-label profile — managed in admin.
        {updated ? ` Last updated ${updated}.` : ""}
      </p>
    </Card>
  );
}

function Swatch({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2 rounded-xl bg-brand-bg p-3">
      {value ? (
        <span
          className="h-8 w-8 shrink-0 rounded-md ring-1 ring-black/10"
          style={{ backgroundColor: value }}
          aria-hidden
        />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-bg text-[9px] text-brand-muted">
          unset
        </span>
      )}
      <div className="flex flex-col">
        <span className="text-xs text-brand-muted">{label}</span>
        <span className="font-mono text-xs tabular-nums text-brand-text">
          {value ?? "—"}
        </span>
      </div>
    </div>
  );
}
