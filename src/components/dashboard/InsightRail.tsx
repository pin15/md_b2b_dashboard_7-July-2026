"use client";

import { Lightbulb, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardTitle, Skeleton } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";
import { useOrgInsights } from "@/lib/hooks/useDashboardData";
import type { InsightCard as InsightCardT } from "@/lib/graphql/types";

/**
 * Top-3 Insight Rail (doc 04 §2.3 Zone B). The Bridge's "what changed and what to
 * do" surface: ≤3 Finding → Play (→ Receipt) cards, ranked concerns-first by the
 * Privacy-Kernel RPC. Every card is a pure aggregate (an org-grain metric move) —
 * no individual data, k≥5 enforced server-side. Severity uses the calm ramp
 * (green/amber/coral) — never red on this gradient surface (doc 10 §2.1).
 */
export function InsightRail({ period }: { period: string }) {
  const { data, isLoading, isError } = useOrgInsights(period);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-4 w-4 text-brand-muted" />
        <CardTitle>Top insights</CardTitle>
        <span className="text-xs text-brand-muted">— findings &amp; one thing to try</span>
      </div>

      {isLoading ? (
        <div className="grid gap-3 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-brand-muted">Insights are unavailable right now.</p>
      ) : !data || data.length === 0 ? (
        <p className="text-sm text-brand-muted">
          No insights this quarter — nothing crossed a threshold or moved materially.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-3">
          {data.map((card) => (
            <InsightCardView key={card.id} card={card} />
          ))}
        </div>
      )}
    </Card>
  );
}

function InsightCardView({ card }: { card: InsightCardT }) {
  const color = SEVERITY[card.severity];
  return (
    <div className="flex flex-col gap-2.5 rounded-xl bg-brand-surface p-4 shadow-card">
      <div className="flex items-start gap-2">
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <p className="text-sm font-medium leading-snug text-brand-text">{card.finding}</p>
      </div>

      <div className="flex items-start gap-1.5 text-sm text-brand-muted">
        <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <span>
          <span className="font-medium text-brand-text">Try:</span> {card.play}
        </span>
      </div>

      {card.receipt ? (
        <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: SEVERITY.green }}>
          <CheckCircle2 className="h-3.5 w-3.5" />
          {card.receipt}
        </div>
      ) : (
        <div className="text-[11px] text-brand-muted">
          Receipt appears once a play is completed and re-measured.
        </div>
      )}
    </div>
  );
}
