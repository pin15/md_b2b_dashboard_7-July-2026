/**
 * Severity colour system — doc 10 §2.1 (LOCKED rule).
 *
 *  • CONTINUOUS gradient (OWI ramp, heatmap, distribution): green → amber → CORAL.
 *    NEVER red. Coral is the calm "serious, act now" top-of-ramp — it says
 *    severity without the stigma of red.
 *  • DISCRETE employer/HR alert (a KPI crossing a cutpoint): red is allowed,
 *    because HR reads it like a finance dashboard and it is aggregate data, not a
 *    person. Use `discreteAlert()` for these and ONLY these.
 *
 * This is an employer surface, so discrete red is permitted. It must never leak
 * onto a gradient. There is no employee-facing surface in this app.
 */

export const SEVERITY = {
  green: "var(--severity-green)",
  amber: "var(--severity-amber)",
  coral: "var(--severity-coral)",
  red: "var(--severity-red)",
  suppressed: "var(--severity-suppressed)",
} as const;

export type GradientBand = "green" | "amber" | "coral";

/**
 * Map a 0–100 score to a calm gradient band. `higherIsBetter` flips direction
 * (e.g. OWI/WHO-5 higher=better; PSS/OBI higher=worse).
 * Returns ONLY green/amber/coral — never red (rule: no red on a gradient).
 */
export function gradientBand(
  score: number,
  higherIsBetter: boolean,
): GradientBand {
  const good = higherIsBetter ? score >= 70 : score < 35;
  const mid = higherIsBetter
    ? score >= 55 && score < 70
    : score >= 35 && score < 68;
  if (good) return "green";
  if (mid) return "amber";
  return "coral";
}

export function gradientColor(score: number, higherIsBetter: boolean): string {
  return SEVERITY[gradientBand(score, higherIsBetter)];
}

/** OWI headline bands (doc 10 §2): Green ≥70 / Amber 55–69 / Coral <55. */
export function owiBand(owi: number): GradientBand {
  if (owi >= 70) return "green";
  if (owi >= 55) return "amber";
  return "coral";
}

/**
 * Discrete employer KPI alert. `breached` true → red (--severity-red). This is
 * the ONLY sanctioned use of red in the app. Example: % High Stress > 20%.
 */
export function discreteAlert(breached: boolean): string {
  return breached ? SEVERITY.red : "var(--brand-text)";
}

/** PSS stress segmentation buckets (doc 10 §2): <35 / 35–67 / ≥68. */
export function stressBucketColor(
  bucket: "Stress-Free" | "Borderline" | "High Stress",
): string {
  switch (bucket) {
    case "Stress-Free":
      return SEVERITY.green;
    case "Borderline":
      return SEVERITY.amber;
    case "High Stress":
      return SEVERITY.coral;
  }
}
