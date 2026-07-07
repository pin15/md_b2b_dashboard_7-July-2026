import type { ReactNode, ButtonHTMLAttributes, CSSProperties } from "react";
import { cn } from "@/lib/utils";

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={cn(
        // Borderless card (DESIGN-SYSTEM.md §3): NO border, NO accent bar, NO blur.
        // Depth comes from a soft two-layer shadow on the white surface over the
        // slate canvas; it lifts a touch on hover. This is the elevation contract
        // every box inherits.
        "rounded-xl bg-brand-surface p-6 shadow-card transition-shadow duration-300 hover:shadow-card-hover",
        className,
      )}
      style={style}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-sm font-medium text-brand-muted tracking-tight",
        className,
      )}
    >
      {children}
    </h3>
  );
}

/**
 * CardHeading — a prominent card header: an optional icon in a soft tile, a BOLD
 * title, and an optional right-aligned action (badge/button). Use for content
 * cards that deserve a strong heading (vs the muted label-style CardTitle).
 */
export function CardHeading({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2.5">
        {icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-bg text-brand-muted">
            {icon}
          </span>
        )}
        <h3 className="truncate text-base font-bold tracking-tight text-brand-text">{title}</h3>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Button({
  children,
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
}) {
  // B2C button: rounded-lg, navy primary (#1E3A5F) with shadow depth, navy focus
  // ring, smooth all-property transition. Matches B2C §7.
  const base =
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:ring-offset-2";
  const variants = {
    primary: "bg-[#1E3A5F] text-white shadow-sm hover:bg-[#162d4a] hover:shadow-md",
    outline:
      "border border-brand-border bg-brand-surface text-brand-text shadow-sm hover:bg-brand-bg",
    ghost: "text-brand-text hover:bg-brand-bg",
  } as const;
  return (
    <button className={cn(base, variants[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function Badge({
  children,
  color,
  className,
}: {
  children: ReactNode;
  color?: string; // a CSS color value (e.g. var(--severity-coral))
  className?: string;
}) {
  return (
    <span
      className={cn(
        // B2C badge: pill, text-xs font-semibold (B2C §8). The severity color-mix
        // tinting below is preserved — only the brand/typography is aligned.
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        className,
      )}
      style={
        color
          ? { backgroundColor: `color-mix(in srgb, ${color} 16%, white)`, color }
          : undefined
      }
    >
      {children}
    </span>
  );
}

/**
 * StatusDot — the borderless replacement for the old `border-l-4` accent bar
 * (DESIGN-SYSTEM.md §3/§6). A small filled dot in a severity/brand tone, with an
 * optional label, used to signal a card's state (alert / celebration / clean)
 * without ever drawing a colored bar or border on the box. A subtle ring softens
 * the dot so it reads as a calm indicator, not a warning light.
 */
export function StatusDot({
  color,
  label,
  className,
}: {
  color: string; // a CSS color value (e.g. var(--severity-green))
  label?: ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 0 3px color-mix(in srgb, ${color} 18%, transparent)` }}
      />
      {label != null && (
        <span className="text-xs font-medium text-brand-muted">{label}</span>
      )}
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-brand-border/60", className)} />
  );
}

/**
 * CardError — the load-FAILURE state for a card. Deliberately distinct from the
 * muted k-anonymity "below threshold" suppression and the "pending" placeholders,
 * so a failed query can never masquerade as legitimate privacy-suppression or
 * honest-pending. Use when a card's query returns isError.
 */
export function CardError({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center rounded-xl border border-severity-red/30 bg-severity-red/10 p-4 text-center text-sm text-severity-red",
        className,
      )}
    >
      Could not load this card — refresh to retry.
    </div>
  );
}
