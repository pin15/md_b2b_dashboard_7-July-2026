"use client";

import { useOrgLifeInviteSummary, useOrgBridgeSummary } from "@/lib/hooks/useDashboardData";
import { WidgetShell, type UniversalState } from "@/components/dashboard/WidgetState";

const MOMENT_LABEL: Record<string, string> = {
  new_parent: "New parent",
  bereavement: "Bereavement",
  caregiving: "Caregiving",
  divorce: "Separation",
  health: "Health event",
  relocation: "Relocation",
  retirement: "Retirement",
  menopause: "Menopause",
};

/**
 * WS-T life-moment invitations + offboard bridges — the KEYSTONE privacy contract.
 * Both tiles read ONLY a SENT/OFFERED count (k≥5) — acceptance, decline, and use are
 * STRUCTURALLY never disclosed to the employer. There is no path to who was invited
 * or whether they accepted. Honest-or-pending: below k → suppressed dignity card.
 */
export function LifeMomentsCard() {
  const { data, isLoading } = useOrgLifeInviteSummary();
  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Life-moment support — invitations sent" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-brand-muted">Invitations sent</span>
            <span className="text-2xl font-semibold tabular-nums">{data.invitationsSent}</span>
          </div>
          {data.byMomentType.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {data.byMomentType.map((m) => (
                <div key={m.momentType} className="flex items-center justify-between text-sm">
                  <span className="text-brand-text">{MOMENT_LABEL[m.momentType] ?? m.momentType}</span>
                  <span className="tabular-nums text-brand-muted">{m.sent}</span>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 text-xs text-brand-muted">
            Sent count only. Whether anyone accepted, declined, or used support is never disclosed — invisible by
            construction.
          </p>
        </>
      )}
    </WidgetShell>
  );
}

export function OffboardBridgeCard() {
  const { data, isLoading } = useOrgBridgeSummary();
  const state: UniversalState = isLoading
    ? "loading"
    : !data || data.status !== "computed"
      ? "suppressed"
      : "live";

  return (
    <WidgetShell title="Continuity bridges — offered to leavers" state={state} k={data?.k}>
      {data?.status === "computed" && (
        <>
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-brand-muted">Bridges offered</span>
            <span className="text-2xl font-semibold tabular-nums">{data.bridgesOffered}</span>
          </div>
          <p className="mt-3 text-xs text-brand-muted">
            Care follows the person out — a 90-day bridge is offered to leavers. Offer count only; acceptance and use
            are never disclosed.
          </p>
        </>
      )}
    </WidgetShell>
  );
}
