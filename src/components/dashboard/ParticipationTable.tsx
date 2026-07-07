"use client";

import { useParticipation } from "@/lib/hooks/useDashboardData";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  MicroStat,
  Foot,
  BandDot,
  PanelSkeleton,
} from "@/components/ui/panels";
import { SEVERITY } from "@/lib/severity";
import type {
  DashboardFilters,
  ParticipationRow,
  ParticipationStatus,
} from "@/lib/graphql/types";

/**
 * Participation Tracker — Tier-2 (Iron Rule v2). Shows the roster BY NAME with
 * filled / not-filled status ONLY. There is NO score/response/risk column and no
 * such field exists on the type. Export is roster + status only.
 */

const STATUS_META: Record<ParticipationStatus, { label: string; color: string }> = {
  // No amber/orange: completed = green, pending (invited, awaiting) = navy, not
  // started (never engaged) = muted slate.
  completed: { label: "Completed", color: SEVERITY.green },
  pending: { label: "Pending", color: "var(--brand-primary)" },
  not_started: { label: "Not started", color: "var(--brand-muted)" },
};

const STATUS_ORDER: ParticipationStatus[] = ["completed", "pending", "not_started"];

// Bar/legend fills: the not-started share reads as "unfilled" (light slate),
// while its row text stays the darker muted slate for legibility.
const BAR_COLOR: Record<ParticipationStatus, string> = {
  completed: SEVERITY.green,
  pending: "var(--brand-primary)",
  not_started: "#cbd5e1",
};

function toCsv(rows: ParticipationRow[]): string {
  const header = ["Employee", "Department", "Team", "Level", "Status", "Last reminder"];
  const lines = rows.map((r) =>
    [
      r.employeeName,
      r.department ?? "",
      r.team ?? "",
      r.level ?? "",
      STATUS_META[r.status].label,
      r.lastReminderAt ?? "",
    ]
      .map((v) => `"${String(v).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header.join(","), ...lines].join("\n");
}

// A period can contain more than one campaign (e.g. Q2 Common Core + a Manager-360),
// so a member assigned to both comes back once per assignment. This is a per-PERSON
// roster (no campaign column), so collapse to one row per member — surfacing the
// least-complete status (what still needs a nudge) and the most recent reminder.
const STATUS_RANK: Record<ParticipationStatus, number> = {
  not_started: 0,
  pending: 1,
  completed: 2,
};

function dedupeByMember(rows: ParticipationRow[]): ParticipationRow[] {
  const byId = new Map<string, ParticipationRow>();
  for (const r of rows) {
    const prev = byId.get(r.memberId);
    if (!prev) {
      byId.set(r.memberId, r);
      continue;
    }
    const status =
      STATUS_RANK[r.status] < STATUS_RANK[prev.status] ? r.status : prev.status;
    const lastReminderAt =
      [prev.lastReminderAt, r.lastReminderAt]
        .filter((d): d is string => Boolean(d))
        .sort()
        .at(-1) ?? null;
    byId.set(r.memberId, { ...prev, status, lastReminderAt });
  }
  return Array.from(byId.values());
}

export function ParticipationTable({ filters }: { filters: DashboardFilters }) {
  const { data, isLoading, isError } = useParticipation(filters);

  function exportCsv() {
    if (!data) return;
    const blob = new Blob([toCsv(dedupeByMember(data))], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participation-${filters.period}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PanelSkeleton className="h-36" />
        <PanelSkeleton className="h-80" />
      </div>
    );
  }
  if (isError || !data) {
    return (
      <Panel className="px-6 py-8 text-center">
        <p className="text-[13.5px] font-medium" style={{ color: SEVERITY.red }}>
          Could not load participation — refresh to retry.
        </p>
      </Panel>
    );
  }

  const rows = dedupeByMember(data);

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.status] += 1;
      return acc;
    },
    { completed: 0, pending: 0, not_started: 0 } as Record<ParticipationStatus, number>,
  );
  const total = rows.length;
  const completionPct = total > 0 ? Math.round((counts.completed / total) * 100) : null;

  return (
    <div className="space-y-8">
      {/* ── Completion — one hairline-divided stat band ─────────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Completion"
          meta={total > 0 ? `${filters.period} · ${total} assigned` : filters.period}
        />
        {total === 0 ? (
          <Panel className="px-6 py-10 text-center">
            <p className="text-[13.5px] font-medium text-slate-900">No one is assigned yet</p>
            <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
              The tally appears once a campaign assigns an assessment to people matching these
              filters — no fabricated count until then.
            </p>
          </Panel>
        ) : (
          <Panel>
            <div className="grid sm:grid-cols-4">
              <div className="border-b border-slate-100 p-6 sm:border-b-0 sm:border-r">
                <MicroStat
                  label="Completion"
                  value={
                    <>
                      {completionPct}
                      <span className="ml-0.5 text-[14px] font-medium text-slate-400">%</span>
                    </>
                  }
                  hint={`${counts.completed} of ${total} assigned`}
                />
              </div>
              {STATUS_ORDER.map((s, i) => (
                <div
                  key={s}
                  className={
                    i < STATUS_ORDER.length - 1
                      ? "border-b border-slate-100 p-6 sm:border-b-0 sm:border-r"
                      : "p-6"
                  }
                >
                  <MicroStat
                    label={STATUS_META[s].label}
                    value={counts[s]}
                    hint={`${Math.round((counts[s] / total) * 100)}% of assigned`}
                  />
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-6 py-4">
              <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                {STATUS_ORDER.filter((s) => counts[s] > 0).map((s, i) => (
                  <div
                    key={s}
                    className={i > 0 ? "ml-px h-full" : "h-full"}
                    style={{
                      width: `${(counts[s] / total) * 100}%`,
                      backgroundColor: BAR_COLOR[s],
                    }}
                    title={`${STATUS_META[s].label}: ${counts[s]}`}
                  />
                ))}
              </div>
              <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1.5">
                {STATUS_ORDER.map((s) => (
                  <span key={s} className="inline-flex items-center gap-1.5 text-[12px]">
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: BAR_COLOR[s] }}
                    />
                    <span className="text-slate-500">{STATUS_META[s].label}</span>
                    <span className="font-medium tabular-nums text-slate-900">{counts[s]}</span>
                  </span>
                ))}
              </div>
            </div>
          </Panel>
        )}
      </section>

      {/* ── Roster — status-only ledger, one row per person ─────────────── */}
      <section className="space-y-3">
        <SectionHeader
          title="Employee roster"
          meta={
            <button
              onClick={exportCsv}
              className="rounded-lg px-2.5 py-1 text-[12.5px] font-medium text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/[0.05]"
            >
              Export CSV — status only
            </button>
          }
        />
        <Panel className="overflow-hidden">
          {total === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-medium text-slate-900">
                No people match these filters
              </p>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                The roster lists everyone assigned an assessment this period. Widen the filters or
                pick another period.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 text-left">
                    <th className="py-2.5 pl-6 pr-4 font-normal">
                      <MicroLabel>Employee</MicroLabel>
                    </th>
                    <th className="py-2.5 pr-4 font-normal">
                      <MicroLabel>Department</MicroLabel>
                    </th>
                    <th className="py-2.5 pr-4 font-normal">
                      <MicroLabel>Team</MicroLabel>
                    </th>
                    <th className="py-2.5 pr-4 font-normal">
                      <MicroLabel>Level</MicroLabel>
                    </th>
                    <th className="py-2.5 pr-4 font-normal">
                      <MicroLabel>Status</MicroLabel>
                    </th>
                    <th className="py-2.5 pr-6 text-right font-normal">
                      <MicroLabel>Last reminder</MicroLabel>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((r) => {
                    const meta = STATUS_META[r.status];
                    return (
                      <tr key={r.memberId} className="transition-colors hover:bg-slate-50/60">
                        <td className="py-3 pl-6 pr-4 text-[13.5px] font-medium leading-5 text-slate-900">
                          {r.employeeName}
                        </td>
                        <td className="py-3 pr-4 text-[13px] leading-5 text-slate-500">
                          {r.department ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-[13px] leading-5 text-slate-500">
                          {r.team ?? "—"}
                        </td>
                        <td className="py-3 pr-4 text-[13px] leading-5 tabular-nums text-slate-500">
                          {r.level ?? "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <BandDot color={meta.color} label={meta.label} />
                        </td>
                        <td className="py-3 pr-6 text-right text-[12.5px] leading-5 tabular-nums text-slate-400">
                          {r.lastReminderAt
                            ? new Date(r.lastReminderAt).toLocaleDateString()
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          <div className="border-t border-slate-100 px-6 py-3.5">
            <Foot>
              Status only — never the answers or score. This is the Tier-2 surface Iron Rule v2
              permits the employer to see by name.
            </Foot>
          </div>
        </Panel>
      </section>
    </div>
  );
}
