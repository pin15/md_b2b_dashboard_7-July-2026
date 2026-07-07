"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Dropdown({
  value,
  options,
  onChange,
  minWidth = 160,
  tone = "light",
  size = "md",
  openOnHover = false,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  minWidth?: number;
  // "light" = default control on a light surface; "dark" = translucent control
  // for the dark navy app bar, with a navy (bar-coloured) menu.
  tone?: "light" | "dark";
  // "md" = default; "sm" = compact (e.g. the app-bar filters).
  size?: "md" | "sm";
  // Open the menu on hover (in addition to click). Used by the app-bar filters
  // on desktop; a short close-delay keeps it open across the trigger→menu gap.
  openOnHover?: boolean;
}) {
  const [open, setOpen] = useState(false);
  // `render` keeps the menu mounted through its exit animation; `show` drives the
  // enter/leave transition (fade + slight slide/scale).
  const [render, setRender] = useState(false);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Clean up any pending close timer on unmount.
  useEffect(() => () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  }, []);

  // Mount → next frame → enter; on close, play the leave transition, then unmount.
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => setShow(true));
      return () => cancelAnimationFrame(id);
    }
    setShow(false);
    const t = setTimeout(() => setRender(false), 260);
    return () => clearTimeout(t);
  }, [open]);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 180);
  };

  const current = options.find((o) => o.value === value);
  const dark = tone === "dark";
  const sm = size === "sm";

  return (
    <div
      ref={ref}
      className="relative"
      style={{ minWidth }}
      onMouseEnter={openOnHover ? () => { cancelClose(); setOpen(true); } : undefined}
      onMouseLeave={openOnHover ? scheduleClose : undefined}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-lg transition-colors duration-150 focus:outline-none focus-visible:ring-2",
          sm ? "h-8 gap-1.5 px-2.5 text-xs" : "h-9 gap-2 px-3 text-sm",
          dark
            ? // Borderless soft pill on the dark app bar — fill only, no outline.
              "bg-white/10 text-white hover:bg-white/[0.18] focus-visible:ring-white/40"
            : "border border-brand-border bg-brand-surface text-brand-text hover:bg-brand-bg focus-visible:ring-[#1E3A5F]",
        )}
      >
        <span className="truncate">{current?.label ?? "Select"}</span>
        <ChevronDown
          className={cn(
            "shrink-0 transition-transform duration-300 ease-out",
            sm ? "h-3.5 w-3.5" : "h-4 w-4",
            dark ? "opacity-70" : "opacity-50",
            open && "rotate-180",
          )}
        />
      </button>
      {render && (
        <div
          className={cn(
            "absolute z-50 mt-1 max-h-64 min-w-full origin-top overflow-auto rounded-lg py-1 shadow-lg transition-all duration-200 ease-out",
            show ? "translate-y-0 scale-100 opacity-100" : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
            dark
              ? // Menu backdrop matches the app bar (navy), with a hairline ring
                // for separation from the page content it floats over.
                "bg-[#1E3A5F] text-white ring-1 ring-white/10"
              : "border border-brand-border bg-brand-surface",
          )}
        >
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              className={cn(
                "block w-full whitespace-nowrap px-3 py-1.5 text-left transition-colors",
                sm ? "text-xs" : "text-sm",
                dark ? "text-white/90 hover:bg-white/10" : "text-brand-text hover:bg-brand-bg",
                o.value === value && (dark ? "bg-white/10 font-medium" : "font-medium"),
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
