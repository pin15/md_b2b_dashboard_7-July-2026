"use client";

import { useDataConfidence } from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";

/**
 * Data Confidence strip.
 * Quality, not health: DCS, Response Validity, and Trust Quotient travel WITH
 * every number so employers never read a metric in isolation.
 */
type Tone = "green" | "amber" | "coral" | "muted";

/**
 * One metric's scoring rules, co-located so the colour, label, and bar fill all
 * derive from the same source of truth. `green`/`amber` are the lower bounds for
 * those bands; below `amber` is coral. `max` is the metric's own scale so the bar
 * isn't forced onto a 0–100 percent assumption.
 */
interface MetricConfig {
  label: string;
  value: number | null;
  unit?: string;
  green: number;
  amber: number;
  max: number;
  hint: string;
}

function tone({ value, green, amber }: MetricConfig): Tone {
  if (value == null) return "muted";
  if (value >= green) return "green";
  if (value >= amber) return "amber";
  return "coral";
}

function toneColor(toneKey: Tone) {
  if (toneKey === "muted") return "var(--brand-muted)";
  return SEVERITY[toneKey];
}

function toneLabel(toneKey: Tone) {
  if (toneKey === "green") return "Reliable";
  if (toneKey === "amber") return "Directional";
  if (toneKey === "coral") return "Low";
  return "Unknown";
}

/** Bar fill as a share of the metric's own scale, clamped to 0–100. */
function fillPercent({ value, max }: MetricConfig) {
  if (value == null || max <= 0) return 0;
  return Math.max(0, Math.min(100, (value / max) * 100));
}

function formatValue(value: number | null) {
  if (value == null) return "—";
  return value.toFixed(1);
}

function formatDate(value?: string | null) {
  if (!value) return "k≥5 active";
  return `As of ${new Date(value).toLocaleDateString()}`;
}

function Metric({ config }: { config: MetricConfig }) {
  const { label, value, unit, hint } = config;
  const toneKey = tone(config);
  const color = toneColor(toneKey);
  const percent = fillPercent(config);

  return (
    <div className="flex min-w-[170px] flex-1 flex-col justify-between px-5 py-3 first:pl-0 last:pr-0">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-brand-muted">
          {label}
        </span>

        <span
          className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
          style={{ color }}
        >
          <span
            aria-hidden
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: color }}
          />
          {toneLabel(toneKey)}
        </span>
      </div>

      <div className="mt-3 flex items-end gap-1">
        <span
          className="text-[32px] font-medium leading-none tracking-[-0.055em] tabular-nums"
          style={{ color }}
        >
          {formatValue(value)}
        </span>

        {unit && value != null && (
          <span className="pb-1 text-[13px] font-medium text-brand-muted">
            {unit}
          </span>
        )}
      </div>

      <div className="mt-3 h-[3px] w-full overflow-hidden rounded-full bg-black/[0.055]">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
            opacity: toneKey === "muted" ? 0.35 : 1,
          }}
        />
      </div>

      <p className="mt-2 max-w-[250px] truncate text-[10.5px] leading-snug text-brand-muted">
        {hint}
      </p>
    </div>
  );
}

function LoadingState() {
  return (
    <div
      className="h-[96px] w-full animate-pulse rounded-xl bg-brand-surface shadow-card"
      aria-hidden
    />
  );
}

export function DataConfidenceStrip({ period }: { period: string }) {
  const { data, isLoading } = useDataConfidence(period);

  if (isLoading || !data) {
    return <LoadingState />;
  }

  const metrics: MetricConfig[] = [
    {
      label: "DCS",
      value: data.dcs,
      green: 80,
      amber: 60,
      max: 100,
      hint: "Participation × validity × representativeness",
    },
    {
      label: "Response Validity",
      value: data.validityPct,
      unit: "%",
      green: 90,
      amber: 80,
      max: 100,
      hint: "RQI-passing responses · target ≥90%",
    },
    {
      label: "Trust Quotient",
      value: data.trustQuotient,
      green: 70,
      amber: 55,
      max: 100,
      hint: "Participation × validity × employee trust",
    },
  ];

  const directional = data.lowConfidence || (data.dcs != null && data.dcs < 60);

  return (
    <section
      className="w-full rounded-xl bg-brand-surface px-5 py-3 shadow-card transition-shadow duration-300 hover:shadow-card-hover"
      style={directional ? { opacity: 0.98 } : undefined}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        {/* Left compact label */}
        <div className="flex w-full shrink-0 flex-col justify-between border-b border-brand-border pb-4 lg:w-[220px] lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: directional ? SEVERITY.amber : SEVERITY.green,
                }}
              />

              <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-brand-muted">
                Data Quality
              </span>
            </div>

            <div className="mt-3 flex items-end justify-between gap-3 lg:block">
              <h3 className="text-[17px] font-semibold tracking-[-0.03em] text-brand-text">
                Data Confidence
              </h3>

              <span className="text-[10.5px] font-medium text-brand-muted lg:mt-1 lg:block">
                {formatDate(data.asOf)}
              </span>
            </div>

            <p className="mt-2 max-w-[200px] text-[10.5px] leading-snug text-brand-muted">
              Reliability context that travels with every reported metric.
            </p>
          </div>

          {directional && (
            <span
              className="mt-2 inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.14em]"
              style={{
                color: SEVERITY.amber,
                backgroundColor: `${SEVERITY.amber}12`,
              }}
            >
              Treat as directional
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="grid flex-1 grid-cols-1 divide-y divide-brand-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {metrics.map((m) => (
            <Metric key={m.label} config={m} />
          ))}
        </div>
      </div>
    </section>
  );
}
