"use client";

import type { ComponentType } from "react";
import { BarChart3, Layers, Trophy, ShieldAlert, Users } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/primitives";
import { SuppressedCell } from "@/components/dashboard/Privacy";
import { SEVERITY, owiBand, stressBucketColor } from "@/lib/severity";
import type {
  SegmentationSlice,
  ByLevelOwi,
  CoverageTile,
  TeamExtreme,
} from "@/lib/graphql/types";

function EmptyState({
  icon: Icon,
  title,
  hint,
  children,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  hint: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-brand-border py-8 text-center">
      <Icon className="h-7 w-7 text-brand-muted opacity-40" />
      <p className="text-sm font-medium text-brand-text">{title}</p>
      <p className="max-w-sm text-xs text-brand-muted">{hint}</p>
      {children}
    </div>
  );
}

export function SegmentationBar({ data }: { data: SegmentationSlice[] }) {
  const visible = data.filter((s) => !s.suppressed && s.pct !== null);
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Employee Segmentation (perceived stress)</CardTitle>
      {visible.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Stress segmentation not available yet"
          hint="This unlocks once PSS-10 is part of the campaign battery and at least 5 people respond."
        >
          <div className="mt-2 flex h-7 w-48 overflow-hidden rounded-md opacity-30">
            <div className="h-full w-1/2" style={{ backgroundColor: SEVERITY.green }} />
            <div className="h-full w-1/3" style={{ backgroundColor: SEVERITY.amber }} />
            <div className="h-full w-1/6" style={{ backgroundColor: SEVERITY.coral }} />
          </div>
        </EmptyState>
      ) : (
        <>
          <div className="flex h-7 w-full overflow-hidden rounded-md">
            {visible.map((s) => (
              <div
                key={s.label}
                className="h-full"
                style={{ width: `${s.pct}%`, backgroundColor: stressBucketColor(s.label) }}
                title={`${s.label}: ${s.pct}%`}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-4">
            {data.map((s) => (
              <div key={s.label} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stressBucketColor(s.label) }} />
                <span className="text-brand-muted">{s.label}</span>
                <span className="font-medium tabular-nums">
                  {s.suppressed || s.pct === null ? "—" : `${s.pct}%`}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}

export function ByLevelBars({ data }: { data: ByLevelOwi[] }) {
  const hasData = data.some((r) => !r.suppressed && r.owi !== null);
  return (
    <Card className="flex flex-col gap-3">
      <CardTitle>Wellness Score by Level</CardTitle>
      {data.length === 0 || !hasData ? (
        <EmptyState
          icon={Layers}
          title="Wellness by level is pending"
          hint="Per-level wellbeing unlocks once the OWI weighting is clinically signed off. Cohorts under 5 stay suppressed."
        >
          <div className="mt-2 flex w-64 flex-col gap-2">
            {["L1", "L2", "L3"].map((lvl, i) => (
              <div key={lvl} className="flex items-center gap-2">
                <span className="w-6 text-xs text-brand-muted">{lvl}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-brand-bg">
                  <div className="h-full rounded-full bg-slate-200" style={{ width: `${[62, 48, 40][i]}%` }} />
                </div>
              </div>
            ))}
          </div>
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {data.map((row) => (
            <div key={row.level} className="flex items-center gap-3">
              <span className="w-8 text-sm font-medium text-brand-muted">{row.level}</span>
              {row.suppressed || row.owi === null ? (
                <div className="flex-1"><SuppressedCell /></div>
              ) : (
                <>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-brand-bg">
                    <div className="h-full rounded-full" style={{ width: `${row.owi}%`, backgroundColor: SEVERITY[owiBand(row.owi)] }} />
                  </div>
                  <span className="w-10 text-right text-sm font-medium tabular-nums">{row.owi}</span>
                </>
              )}
              <span className="w-16 text-right text-xs text-brand-muted">n={row.n}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function CoverageTiles({ data }: { data: CoverageTile[] }) {
  const participation = data.find((t) => /participation/i.test(t.instrument));
  const pct = participation && !participation.suppressed ? participation.completedPct : null;
  const others = data.filter((t) => t !== participation);
  const TARGET = 70;

  return (
    <Card className="flex flex-col gap-4">
      <CardTitle>Assessment Coverage</CardTitle>

      {pct !== null && pct !== undefined ? (
        <div className="rounded-xl bg-brand-bg p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-brand-muted">Participation</div>
              <div className="mt-0.5 text-3xl font-semibold tabular-nums text-brand-text">{pct}%</div>
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-medium"
              style={{ color: pct >= TARGET ? SEVERITY.green : SEVERITY.amber }}
            >
              <Users className="h-4 w-4" />
              {pct >= TARGET ? "at / above target" : `below ${TARGET}% target`}
            </div>
          </div>
          <div className="relative mt-3 h-2.5 w-full overflow-hidden rounded-full bg-brand-bg">
            <div
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: pct >= TARGET ? SEVERITY.green : "var(--brand-primary)" }}
            />
            <div className="absolute top-0 h-full border-l-2 border-brand-text/40" style={{ left: `${TARGET}%` }} title={`${TARGET}% target`} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-brand-muted">
            <span>0%</span>
            <span>target {TARGET}%</span>
            <span>100%</span>
          </div>
        </div>
      ) : (
        <EmptyState icon={Users} title="Coverage not available yet" hint="Participation appears once a campaign closes and a snapshot is frozen." />
      )}

      {others.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {others.map((t) => (
            <div key={t.instrument} className="rounded-lg bg-brand-bg p-3 text-center">
              <div className="text-xs text-brand-muted">{t.instrument}</div>
              <div className="mt-1 text-xl font-semibold tabular-nums">
                {t.suppressed || t.completedPct === null ? <SuppressedCell /> : `${t.completedPct}%`}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-brand-muted">
        Drill into the named Participation Tracker for who has / hasn&apos;t completed (status only).
      </p>
    </Card>
  );
}

export function TeamExtremes({
  mostVulnerable,
  happiest,
}: {
  mostVulnerable: TeamExtreme | null;
  happiest: TeamExtreme | null;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TeamCard title="Most Vulnerable Team" icon={ShieldAlert} team={mostVulnerable} />
      <TeamCard title="Happiest Team" icon={Trophy} team={happiest} />
    </div>
  );
}

function TeamCard({
  title,
  icon: Icon,
  team,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  team: TeamExtreme | null;
}) {
  const empty = !team || team.suppressed || team.owi === null;
  return (
    <Card className="flex flex-col gap-2">
      <CardTitle>{title}</CardTitle>
      {empty ? (
        <EmptyState
          icon={Icon}
          title="No team meets the threshold yet"
          hint="A team appears here once 5+ of its members respond — protecting anonymity."
        />
      ) : (
        <>
          <div className="text-base font-medium text-brand-text">{team!.team}</div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-semibold tabular-nums" style={{ color: SEVERITY[owiBand(team!.owi as number)] }}>
              {team!.owi}
            </span>
            <span className="text-xs text-brand-muted">OWI · n={team!.n}</span>
          </div>
        </>
      )}
    </Card>
  );
}
