"use client";

import { Card, CardTitle, Badge, Skeleton, CardError } from "@/components/ui/primitives";
import { useThermocline } from "@/lib/northstar";
import { SEVERITY } from "@/lib/severity";
import { Waves } from "lucide-react";

/**
 * Thermocline Profile (WS-W W) — how far an upward stress/strain signal travels
 * before it attenuates across the org's levels (l1→l2→l3), off a published banded
 * source metric (default PSS_HIGH_PCT), from get_org_thermocline. The per-layer
 * values are already employer-visible published cells (k-safe) — no individual data
 * crosses the boundary. A sharp drop at a boundary = a "thermocline" where the
 * signal stops rising (information loss up the hierarchy).
 *
 * Honest-or-pending: profile 'insufficient_layers'/'no_snapshot'/'no_org' → pending
 * tile; 'computed' → the layer ladder + the located thermocline boundary. Calm
 * gradient, never a discrete red alert.
 */
function pct(v: number | null): string {
  return v == null ? "—" : `${Math.round(v * 1000) / 10}%`;
}

const BAND_TONE: Record<string, string> = {
  green: SEVERITY.green,
  amber: SEVERITY.amber,
  coral: SEVERITY.coral,
};

export function ThermoclineCard({ period }: { period: string }) {
  const q = useThermocline(period);
  const data = q.data;

  if (q.isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;
  if (q.isError) return <CardError className="h-48" />;

  const computed = data?.profile === "computed";

  return (
    <Card className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-brand-muted" />
          <CardTitle>Thermocline profile</CardTitle>
        </div>
        {computed && data?.thermoclineBoundary ? (
          <Badge color={SEVERITY.amber}>break at {data.thermoclineBoundary}</Badge>
        ) : (
          <Badge>{data?.profile === "no_org" ? "pending" : "pending"}</Badge>
        )}
      </div>

      {!computed || !data ? (
        <p className="text-sm text-brand-muted">
          This lights up once at least two org levels have a published, k-safe band on{" "}
          {data?.sourceMetric ?? "the source metric"} — it then shows where an upward
          stress signal attenuates across the hierarchy. Aggregate-only.
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            {data.layers.map((l) => (
              <div key={l.level} className="flex items-center gap-3">
                <span className="w-8 text-xs uppercase tracking-wide text-brand-muted">
                  {l.level}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-brand-bg">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (l.value ?? 0) * 100)}%`,
                      backgroundColor: l.band
                        ? BAND_TONE[l.band] ?? "var(--brand-muted)"
                        : "var(--brand-muted)",
                    }}
                  />
                </div>
                <span className="w-12 text-right text-xs tabular-nums text-brand-text">
                  {pct(l.value)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-lg bg-brand-bg p-3 text-center">
            {data.boundaries.map((b) => (
              <div key={b.boundary}>
                <div className="text-sm font-semibold tabular-nums text-brand-text">
                  {pct(b.attenuation)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-brand-muted">
                  {b.boundary} attenuation
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <p className="text-[11px] text-brand-muted">
        Source: {data?.sourceMetric ?? "PSS_HIGH_PCT"} banded layers · sharp-drop ≥
        {data?.sharpDropThreshold != null
          ? `${Math.round(data.sharpDropThreshold * 100)}%`
          : "40%"}{" "}
        · k≥{data?.k ?? 5} · aggregate-only.
      </p>
    </Card>
  );
}
