import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The redesigned dashboard's visual primitives (first proven on the Act and
 * Overview tabs). Typography-led, near-monochrome slate; navy (#1E3A5F) is the
 * single interactive accent; severity colour appears only on data (numerals,
 * dots, fills) — never as chrome. Boxes are borderless elevation panels;
 * hairline dividers and alignment carry the structure.
 *
 * Composition pattern: a section = <SectionHeader> + one <Panel> whose cells
 * are hairline-divided (border-slate-100), each cell built from MicroLabel /
 * MicroStat / KeyValueRow / Foot. Empty, pending, and k-suppressed states are
 * quiet prose (SuppressedNote / plain slate-400 text), never badges or dashed
 * boxes — and never a fabricated value.
 */

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05),0_10px_20px_-16px_rgba(15,23,42,0.12)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionHeader({ title, meta }: { title: string; meta?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-1">
      <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-slate-900">{title}</h3>
      {meta != null && <span className="text-[12.5px] tabular-nums text-slate-400">{meta}</span>}
    </div>
  );
}

export function MicroLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-slate-400">
      {children}
    </span>
  );
}

export function MicroStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <MicroLabel>{label}</MicroLabel>
      <span className="text-[26px] font-semibold leading-8 tracking-[-0.02em] tabular-nums text-slate-900">
        {value ?? "—"}
      </span>
      {hint != null && <span className="text-[12px] leading-4 text-slate-500">{hint}</span>}
    </div>
  );
}

/** In-panel cell heading: bold 13.5px title + optional quiet right-aligned state. */
export function CellTitle({ children, state }: { children: ReactNode; state?: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h4 className="text-[13.5px] font-semibold tracking-[-0.01em] text-slate-900">{children}</h4>
      {state != null && <span className="shrink-0 text-[11.5px] text-slate-400">{state}</span>}
    </div>
  );
}

export function KeyValueRow({
  label,
  value,
  suppressed,
}: {
  label: ReactNode;
  value?: ReactNode;
  suppressed?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-[5px] text-[13px] leading-5">
      <span className="min-w-0 truncate text-slate-600">{label}</span>
      {suppressed ? (
        <span className="shrink-0 text-slate-400">below threshold</span>
      ) : (
        <span className="shrink-0 tabular-nums text-slate-900">{value}</span>
      )}
    </div>
  );
}

export function Foot({ children }: { children: ReactNode }) {
  return <p className="text-[11.5px] leading-relaxed text-slate-400">{children}</p>;
}

export function SuppressedNote({ k, children }: { k?: number | null; children?: ReactNode }) {
  return (
    <p className="text-[13px] leading-relaxed text-slate-400">
      {children ?? (
        <>
          Lights up once at least {k ?? 5} people take part — group aggregates only, never an
          individual. Below that it stays unshowable by design.
        </>
      )}
    </p>
  );
}

/** A small dot + label in a semantic tone — the only sanctioned colored chrome. */
export function BandDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color }}>
      <span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

export function CellSkeleton() {
  return <div className="h-24 animate-pulse rounded-lg bg-slate-100" />;
}

export function PanelSkeleton({ className }: { className?: string }) {
  return <div className={cn("h-40 animate-pulse rounded-2xl bg-slate-100", className)} />;
}
