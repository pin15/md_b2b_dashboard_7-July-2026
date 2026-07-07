"use client";

import type { ReactNode } from "react";
import { Card, CardTitle, Badge, Skeleton, StatusDot } from "@/components/ui/primitives";
import { SEVERITY } from "@/lib/severity";

/**
 * THE UNIVERSAL STATE SYSTEM (doc 04 §"PART 4 — every widget implements all seven").
 * Doc 10 / WS-L residual. A single, reusable contract so every dashboard widget
 * renders the SAME seven states honestly — never a fabricated number, never an empty
 * sparkline, never red on a gradient.
 *
 *   1. live          — data + trend + narrative (the widget renders its own body).
 *   2. first_quarter — no trend yet: "Your starting point. Trends begin next quarter."
 *   3. suppressed    — n<k dignity card (P5); roll-up affordance where a parent exists.
 *   4. low_confidence— DCS below threshold: data renders DIMMED + a self-caveat banner.
 *   5. stale         — campaign window open: last quarter shown + "refreshing on close".
 *   6. alert         — a KRI threshold crossed: quiet left-border accent; finding pins.
 *   7. celebration   — an improvement milestone: calm acknowledgement (never red).
 *
 * Usage: compute the state, pass it in. For `live`/`alert`/`celebration`/`low_confidence`/
 * `stale` the widget's own `children` render (optionally dimmed/accented); for
 * `first_quarter`/`suppressed` the standard framing card renders instead.
 */
export type UniversalState =
  | "loading"
  | "live"
  | "first_quarter"
  | "suppressed"
  | "low_confidence"
  | "stale"
  | "alert"
  | "celebration";

export function StateBadge({ state }: { state: UniversalState }) {
  switch (state) {
    case "first_quarter":
      return <Badge>starting point</Badge>;
    case "suppressed":
      return <Badge>below threshold</Badge>;
    case "low_confidence":
      return <Badge color={SEVERITY.amber}>directional</Badge>;
    case "stale":
      return <Badge color={SEVERITY.amber}>refreshing on close</Badge>;
    case "alert":
      return <Badge color={SEVERITY.red}>needs attention</Badge>;
    case "celebration":
      return <Badge color={SEVERITY.green}>milestone</Badge>;
    default:
      return null;
  }
}

/**
 * A widget shell that renders the right framing for non-data states and otherwise
 * hands rendering to `children`. Keeps the calm-data rules in one place.
 */
export function WidgetShell({
  title,
  state,
  k,
  staleChip,
  alertNote,
  celebrationNote,
  children,
}: {
  title: string;
  state: UniversalState;
  k?: number | null;
  staleChip?: string | null; // e.g. "4 days"
  alertNote?: string | null;
  celebrationNote?: string | null;
  children?: ReactNode;
}) {
  if (state === "loading") return <Skeleton className="h-48 w-full rounded-xl" />;

  if (state === "first_quarter") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>{title}</CardTitle>
        <StateBadge state={state} />
        <p className="text-sm text-brand-muted">
          Your starting point. Trends begin next quarter — this is the baseline we measure progress against.
        </p>
      </Card>
    );
  }

  if (state === "suppressed") {
    return (
      <Card className="flex flex-col gap-2">
        <CardTitle>{title}</CardTitle>
        <StateBadge state={state} />
        <p className="text-sm text-brand-muted">
          This lights up once at least {k ?? 5} people take part — group aggregates only, never an individual.
          Below that threshold it stays unshowable by design (privacy floor k≥{k ?? 5}).
        </p>
      </Card>
    );
  }

  // live / low_confidence / stale / alert / celebration all render the body, with
  // the appropriate state signal/dimming/banner. The state is signalled by a
  // StatusDot + badge — never a colored bar/border (DESIGN-SYSTEM.md §3). Red is
  // permitted ONLY on the discrete alert dot (doc 10 §2.1), never on a gradient.
  const accent =
    state === "alert" ? SEVERITY.red : state === "celebration" ? SEVERITY.green : undefined;

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {accent && <StatusDot color={accent} />}
          <CardTitle>{title}</CardTitle>
        </div>
        <StateBadge state={state} />
      </div>

      {state === "stale" && (
        <p className="text-xs text-brand-muted">
          Campaign window is open — showing last quarter. Refreshing on close{staleChip ? ` in ${staleChip}` : ""}.
          The deliberate delay is a privacy feature.
        </p>
      )}

      {state === "low_confidence" && (
        <p className="text-xs text-brand-muted">Participation low — treat as directional.</p>
      )}

      {state === "alert" && alertNote && (
        <p className="text-xs font-medium" style={{ color: SEVERITY.red }}>
          {alertNote}
        </p>
      )}

      {state === "celebration" && celebrationNote && (
        <p className="text-xs font-medium" style={{ color: SEVERITY.green }}>
          {celebrationNote}
        </p>
      )}

      <div className={state === "low_confidence" ? "opacity-60" : undefined}>{children}</div>
    </Card>
  );
}
