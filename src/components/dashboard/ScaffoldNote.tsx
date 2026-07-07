import { Info } from "lucide-react";

/**
 * Honest scaffolding note. Lists panels deliberately ABSENT (privacy) and/or
 * pending later phases — never a fabricated placeholder number (doc 10 §8 rule:
 * stub null-safe, surface the gap, never invent).
 */
export function ScaffoldNote({
  absent = [],
  pending = [],
}: {
  absent?: string[];
  pending?: string[];
}) {
  if (absent.length === 0 && pending.length === 0) return null;
  return (
    <div className="rounded-xl border border-dashed border-brand-border bg-brand-surface p-4 text-sm">
      <div className="mb-2 flex items-center gap-2 font-medium text-brand-text">
        <Info className="h-4 w-4 text-brand-muted" />
        Panel notes
      </div>
      <ul className="space-y-1 text-brand-muted">
        {absent.map((a) => (
          <li key={a}>
            <span className="font-medium text-brand-text">Absent by design:</span>{" "}
            {a}
          </li>
        ))}
        {pending.map((p) => (
          <li key={p}>
            <span className="font-medium text-brand-text">Pending:</span> {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
