import type { ReactNode } from "react";

/**
 * Elegant, instant hover tooltip — a small dark bubble that fades in on hover
 * (CSS group-hover, ~100ms; no native `title` delay). Used to reveal a short
 * form's full explanation + formula across the dashboard. The trigger gets a
 * dotted underline + help cursor so it reads as hoverable.
 */
export function HintTip({
  children,
  tip,
  placement = "top",
}: {
  children: ReactNode;
  tip?: string | null;
  placement?: "top" | "bottom";
}) {
  if (!tip) return <>{children}</>;
  const pos = placement === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const enter =
    placement === "top"
      ? "translate-y-1 group-hover/tip:translate-y-0"
      : "-translate-y-1 group-hover/tip:translate-y-0";
  return (
    <span className="group/tip relative inline-block cursor-help border-b border-dotted border-slate-400/70">
      {children}
      <span
        role="tooltip"
        className={
          "pointer-events-none absolute left-0 z-50 w-64 rounded-lg bg-slate-900/95 px-3 py-2 " +
          "text-left text-[11.5px] font-normal normal-case leading-relaxed tracking-normal text-white/95 " +
          "shadow-xl ring-1 ring-black/10 backdrop-blur-sm " +
          "opacity-0 transition-all duration-100 ease-out group-hover/tip:opacity-100 " +
          enter +
          " " +
          pos
        }
      >
        {tip}
      </span>
    </span>
  );
}
