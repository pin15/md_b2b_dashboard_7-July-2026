"use client";

import { useState } from "react";
import { useOrgIncidents, useOrgIncidentUptake } from "@/lib/hooks/useDashboardData";
import { Card, CardTitle, Badge, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { Siren } from "lucide-react";
import type { OrgIncident } from "@/lib/graphql/types";

const STATUS_TONE: Record<string, string> = {
  readiness: SEVERITY.amber,
  active: SEVERITY.red,
  response: SEVERITY.red,
  recovery: SEVERITY.amber,
  closed: SEVERITY.green,
};

const TYPE_LABEL: Record<string, string> = {
  layoff: "Workforce reduction",
  m_and_a: "M&A integration",
  postvention: "Postvention",
  dv: "Domestic violence",
  violence_threat: "Violence / threat",
  critical_incident: "Critical incident",
  bcp: "Business continuity",
};

/**
 * WS-W E — org critical-incident register + per-incident uptake. The register
 * (get_org_incidents) carries the ORG's own incident metadata + SLA timeline — no
 * member data. Uptake (get_org_incident_uptake) is the ONLY employer path into an
 * incident's support: offers-sent + an accepted count that is itself SUPPRESSED below
 * k. The employer never sees who was offered support or who accepted. Honest-or-pending.
 */
export function IncidentsPanel() {
  const { data, isLoading } = useOrgIncidents();
  const [selected, setSelected] = useState<string | null>(null);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-xl" />;

  const incidents = data?.incidents ?? [];

  if (incidents.length === 0) {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle className="flex items-center gap-2">
          <Siren className="h-4 w-4 text-brand-muted" /> Critical incidents
        </CardTitle>
        <Badge color={SEVERITY.green}>none active</Badge>
        <p className="text-sm text-brand-muted">
          No critical incidents are on record for the organisation. Readiness retainers activate an SLA clock the
          moment one is declared.
        </p>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <CardTitle className="flex items-center gap-2">
        <Siren className="h-4 w-4 text-brand-muted" /> Critical incidents
      </CardTitle>
      <div className="space-y-2">
        {incidents.map((inc) => (
          <IncidentRow
            key={inc.id}
            inc={inc}
            open={selected === inc.id}
            onToggle={() => setSelected(selected === inc.id ? null : inc.id)}
          />
        ))}
      </div>
      <p className="text-xs text-brand-muted">
        Incident register + uptake only. Who was offered support and who accepted is never disclosed; the accepted
        count is suppressed below the privacy floor.
      </p>
    </Card>
  );
}

function IncidentRow({ inc, open, onToggle }: { inc: OrgIncident; open: boolean; onToggle: () => void }) {
  const tone = STATUS_TONE[inc.status] ?? SEVERITY.amber;
  return (
    <div className="rounded-xl bg-brand-bg p-3">
      <button onClick={onToggle} className="flex w-full items-start justify-between gap-2 text-left">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-brand-text">{inc.title ?? TYPE_LABEL[inc.incidentType] ?? inc.incidentType}</span>
          <span className="text-[11px] text-brand-muted">
            {TYPE_LABEL[inc.incidentType] ?? inc.incidentType}
            {inc.severityTier ? ` · ${inc.severityTier}` : ""} · {inc.scope ?? "—"}
            {inc.affectedEstimate != null ? ` · ~${inc.affectedEstimate} affected` : ""}
          </span>
        </div>
        <Badge color={tone}>{inc.status}</Badge>
      </button>
      {open && (
        <div className="mt-3 border-t border-brand-border pt-3">
          {inc.summary && <p className="text-xs text-brand-muted">{inc.summary}</p>}
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-brand-muted">
            {inc.activatedAt && <span>Activated {fmt(inc.activatedAt)}</span>}
            {inc.activationDueAt && <span>SLA due {fmt(inc.activationDueAt)}</span>}
            {inc.irpIssuedAt && <span>IRP {fmt(inc.irpIssuedAt)}</span>}
            {inc.recoveryAt && <span>Recovery {fmt(inc.recoveryAt)}</span>}
            {inc.closedAt && <span>Closed {fmt(inc.closedAt)}</span>}
          </div>
          <IncidentUptake incidentId={inc.id} />
        </div>
      )}
    </div>
  );
}

function IncidentUptake({ incidentId }: { incidentId: string }) {
  const { data, isLoading } = useOrgIncidentUptake(incidentId);
  if (isLoading) return <Skeleton className="mt-3 h-12 w-full rounded-lg" />;
  if (!data || data.status !== "computed") {
    return (
      <p className="mt-3 text-[11px] text-brand-muted">
        Support uptake is below the reporting threshold (k≥{data?.k ?? 5}) — unshowable by design.
      </p>
    );
  }
  return (
    <div className="mt-3 flex gap-6 text-sm">
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-brand-muted">Offers sent</span>
        <span className="tabular-nums font-semibold">{data.offersSent}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[11px] uppercase tracking-wide text-brand-muted">Accepted</span>
        <span className="tabular-nums font-semibold">
          {data.acceptedSuppressed ? "below threshold" : data.accepted}
        </span>
      </div>
    </div>
  );
}

function fmt(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString();
  } catch {
    return iso;
  }
}
