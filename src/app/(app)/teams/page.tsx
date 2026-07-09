"use client";

import { Suspense } from "react";
import { useTeamHome } from "@/lib/hooks/useDashboardData";
import { useUrlFilters } from "@/lib/hooks/useFilters";
import { Card, CardTitle, Badge, Skeleton, StatusDot } from "@/components/ui/primitives";
import { SEVERITY, type GradientBand } from "@/lib/severity";
import { AcademyCompletionCard } from "@/components/dashboard/AcademyCompletionCard";
import { CertificationProgressCard } from "@/components/dashboard/CertificationProgressCard";
import { Manager360Card } from "@/components/dashboard/Manager360Card";
import { HintTip } from "@/components/ui/HintTip";
import { GLOSSARY } from "@/lib/glossary";

const DEFAULT_PERIOD = "2026-Q2";
const BAND_LABEL: Record<string, string> = { green: "Healthy", amber: "Steady", coral: "Needs care" };

/**
 * L2 "My Teams" (doc 04 §L2 / doc 06 §1.4). A manager sees ONLY their own team,
 * at k≥5, as a DIRECTION (wellbeing band, not a number) + one Finding + one Play.
 * No individual scores, no leaderboards. Sub-k teams show "below threshold".
 */
export default function TeamsPage() {
  // useUrlFilters reads useSearchParams → wrap in Suspense for static prerender (Next 16).
  return (
    <Suspense fallback={<Skeleton className="h-64 w-full rounded-xl" />}>
      <TeamsContent />
    </Suspense>
  );
}

function TeamsContent() {
  const { state } = useUrlFilters(DEFAULT_PERIOD);
  const { data, isLoading } = useTeamHome(state.period);

  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!data || data.status === "no_team") {
    return (
      <Card>
        <CardTitle>My Team</CardTitle>
        <p className="mt-2 text-sm text-brand-muted">
          No team is associated with your account. My-Teams is for line managers (L2).
        </p>
      </Card>
    );
  }

  if (data.status === "suppressed") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>{data.team ?? "My Team"}</CardTitle>
        <Badge>below reporting threshold</Badge>
        <p className="text-sm text-brand-muted">{data.message}</p>
      </Card>
    );
  }

  const band = (data.wellbeingBand ?? "amber") as GradientBand;
  const color = SEVERITY[band];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-brand-text">{data.team}</h1>
        <p className="text-sm text-brand-muted">
          Your team only · aggregate at{" "}
          <HintTip tip={GLOSSARY.k}>k≥{data.n >= 5 ? 5 : data.n}</HintTip> · directions, never individual scores.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Team wellbeing</span>
          <span className="text-2xl font-semibold" style={{ color }}>
            {BAND_LABEL[band] ?? band}
          </span>
          <span className="text-xs text-brand-muted">direction this quarter (not a score)</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Participation</span>
          <span className="text-2xl font-semibold tabular-nums">
            {data.participationPct == null ? "—" : `${data.participationPct}%`}
          </span>
          <span className="text-xs text-brand-muted">target ≥70%</span>
        </Card>
        <Card className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-brand-muted">Team size</span>
          <span className="text-2xl font-semibold tabular-nums">{data.n}</span>
          <span className="text-xs text-brand-muted">responding members</span>
        </Card>
      </div>

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow-card">
        <div>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-brand-muted">
            <StatusDot color={color} />
            This quarter&apos;s finding
          </span>
          <p className="mt-1 text-brand-text">{data.finding}</p>
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-muted">One play to try</span>
          <p className="mt-1 text-brand-text">{data.play}</p>
        </div>
      </div>

      <p className="text-xs text-brand-muted">
        You never see who responded or any individual&apos;s result — only your team&apos;s aggregate at{" "}
        <HintTip tip={GLOSSARY.k}>k≥5</HintTip>.
      </p>

      {/* WS-U U0 — Manager Academy completion (k≥5 aggregate, never an individual). */}
      <AcademyCompletionCard period={state.period} />

      {/* WS-U U2/U3 — Blended-cohort progress + D30 certification pass-rate (k≥5 aggregate). */}
      <CertificationProgressCard />

      {/* WS-U U6 — Manager 360 (own report only; ≥4-rater floor, individuals never shown). */}
      <Manager360Card />
    </div>
  );
}
