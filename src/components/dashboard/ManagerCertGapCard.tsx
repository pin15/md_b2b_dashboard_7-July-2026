"use client";

import { Card, CardTitle, Skeleton, CardError } from "@/components/ui/primitives";
import { useMetricCells } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import { GraduationCap } from "lucide-react";

/**
 * Manager Certification Gap (KHI, WS-U U5, b2b_281). The proof metric: average
 * team-OWI of D30-CERTIFIED managers minus that of UNCERTIFIED managers — a positive
 * gap is the certification paying off. Org-grain, l3-only, double k≥5 (≥5 evaluable
 * managers on EACH side) or it suppresses; never names a manager. CALM gradient.
 */

// manager_cert_gap_band: OWI-pt gap, positive=good. green ≥8 / amber ≥3 / coral <3.
function tone(v: number): string {
  if (v >= 8) return SEVERITY.green;
  if (v >= 3) return SEVERITY.amber;
  return SEVERITY.coral;
}

export function ManagerCertGapCard({ period }: { period: string }) {
  const org = useMetricCells("MANAGER_CERT_GAP", "ORG", period);
  if (org.isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (org.isError) return <CardError className="h-40" />;

  const cell = org.data?.[0];
  const suppressed = !cell || cell.suppressed || cell.value == null;
  const v = cell?.value ?? null;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-brand-muted" />
        <CardTitle>Certified-manager wellbeing gap</CardTitle>
      </div>

      {suppressed || v == null ? (
        <p className="text-sm text-brand-muted">
          Pending — appears once ≥5 certified and ≥5 uncertified managers each have a
          k≥5 team. Leadership-only; never names a manager.
        </p>
      ) : (
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-semibold tabular-nums" style={{ color: tone(v) }}>
            {v > 0 ? `+${v}` : v}
          </span>
          <span className="text-sm text-brand-muted">OWI pts · {cell!.n} managers</span>
        </div>
      )}

      <p className="text-[11px] text-brand-muted">
        Team-OWI of D30-certified managers vs uncertified — the certification proof. Positive
        = certified managers&apos; teams fare better. Aggregate only, k≥5, l3-only. good ≥8 pts.
      </p>
    </Card>
  );
}
