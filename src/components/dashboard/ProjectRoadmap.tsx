"use client";

import {
  UserPlus,
  ClipboardCheck,
  HeartHandshake,
  Activity,
  BarChart3,
  RefreshCw,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { useOrgBranding } from "@/components/branding/OrgBrandingProvider";

type Status = "done" | "active" | "locked";

interface Step {
  title: string;
  desc: string;
  color: string;
  icon: LucideIcon;
  status: Status;
}

const STEPS: Step[] = [
  // Distinct cool ramp — teal → emerald → green for the done steps, a brighter
  // blue for the active step, navy/slate for locked. Varied per step but with NO
  // orange, yellow, or purple anywhere (DESIGN-SYSTEM.md §4).
  {
    title: "Onboarding",
    color: "#0EA5A4",
    icon: UserPlus,
    status: "done",
    desc: "Roster imported, employees invited and consent captured. Departments & seniority mapped.",
  },
  {
    title: "Baseline",
    color: "#10B981",
    icon: ClipboardCheck,
    status: "done",
    desc: "Q1 baseline battery completed — MHSF-III, Big-5 and the Common Core across all levels.",
  },
  {
    title: "Care Activated",
    color: "#22C55E",
    icon: HeartHandshake,
    status: "done",
    desc: "Therapy & coaching live. Organisation credits allocated; sessions hosted on Teams.",
  },
  {
    title: "Q2 Re-assess",
    color: "#1E3A5F", // brand navy — the "you are here" / active accent (matches nav + tabs)
    icon: Activity,
    status: "active",
    desc: "Current quarter — pulse + reassessment in progress. 76.5% participation so far.",
  },
  {
    title: "Q3 Review",
    color: "#94A3B8", // muted slate — locked / not yet started
    icon: BarChart3,
    status: "locked",
    desc: "Mid-year OWI trend, heatmaps and QBR report. Unlocks at the start of Q3.",
  },
  {
    title: "Renewal & Impact",
    color: "#94A3B8", // muted slate — locked / not yet started
    icon: RefreshCw,
    status: "locked",
    desc: "Annual ROI, outcome summary and program renewal. Locked until the cycle closes.",
  },
];

const CANVAS_W = 1320;
const CANVAS_H = 460;

const PANEL_TOP = 142;
const PANEL_START_X = 42;

const PANEL_W = 132;
const PANEL_H = 228;

const STEP_GAP = 190;

const CHEVRON_W = 48;
const CHEVRON_H = 76;

function getPanelLeft(index: number) {
  return PANEL_START_X + index * STEP_GAP;
}

function isPriorityHeading(title: string) {
  return (
    title === "Care Activated" ||
    title === "Q2 Re-assess" ||
    title === "Q3 Review"
  );
}

function HeaderDots() {
  return (
    <div
      className="absolute left-0 right-0 flex items-center justify-center"
      style={{ top: 24, gap: 7 }}
    >
      {STEPS.map((s) => (
        <span
          key={s.title}
          style={{
            width: 7,
            height: 7,
            borderRadius: 2,
            backgroundColor: s.color,
          }}
        />
      ))}
    </div>
  );
}

function StatusTag({ status, color }: { status: Status; color: string }) {
  const isDone = status === "done";
  const isActive = status === "active";

  const label = isDone ? "Done" : isActive ? "Live" : "Locked";

  return (
    <div
      aria-label={label}
      title={label}
      className="absolute flex items-center"
      style={{
        right: 8,
        top: 8,
        gap: 4,
        zIndex: 8,
      }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: 20,
          height: 20,
          borderRadius: 999,
          backgroundColor: isDone ? color : "#FFFFFF",
          border: isDone
            ? `1px solid ${color}`
            : isActive
              ? `1.6px solid ${color}`
              : "1.6px solid #cbd5e1",
          boxShadow: isDone
            ? `0 4px 10px ${color}38`
            : "0 3px 8px rgba(15, 23, 42, 0.08)",
        }}
      >
        {isDone ? (
          <span
            style={{
              color: "#FFFFFF",
              fontSize: 12,
              fontWeight: 900,
              lineHeight: 1,
              transform: "translateY(-0.5px)",
            }}
          >
            ✓
          </span>
        ) : isActive ? (
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              backgroundColor: color,
            }}
          />
        ) : (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 999,
              backgroundColor: "#cbd5e1",
            }}
          />
        )}
      </span>
    </div>
  );
}

function Chevron({
  index,
  color,
  muted = false,
}: {
  index: number;
  color: string;
  muted?: boolean;
}) {
  const left = getPanelLeft(index) + PANEL_W - 14;

  return (
    <div
      aria-hidden
      className="absolute"
      style={{
        left,
        top: PANEL_TOP + 66,
        width: CHEVRON_W,
        height: CHEVRON_H,
        zIndex: 8,
        pointerEvents: "none",
      }}
    >
      <span
        className="absolute"
        style={{
          left: -7,
          top: -56,
          width: 18,
          height: 188,
          background:
            "linear-gradient(90deg, rgba(25,33,45,0.12) 0%, rgba(25,33,45,0.035) 62%, transparent 100%)",
          filter: "blur(7px)",
          opacity: 0.24,
        }}
      />

      <span
        className="absolute"
        style={{
          left: -5,
          top: -56,
          width: 1,
          height: 188,
          background: "rgba(25, 33, 45, 0.06)",
        }}
      />

      <svg
        viewBox="0 0 48 76"
        preserveAspectRatio="none"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      >
        <path
          d="
            M 0 0
            H 22
            C 26 0 28.5 1.8 30.5 5.2
            L 46 34
            C 48.5 38 48.5 38 46 42
            L 30.5 70.8
            C 28.5 74.2 26 76 22 76
            H 0
            L 20 38
            Z
          "
          fill={muted ? "#cbd5e1" : color}
          opacity={muted ? 0.82 : 1}
        />
      </svg>
    </div>
  );
}

function StepPanel({ step, index }: { step: Step; index: number }) {
  const Icon = step.icon;
  const left = getPanelLeft(index);
  const priorityHeading = isPriorityHeading(step.title);

  return (
    <div
      className="absolute"
      style={{
        left,
        top: PANEL_TOP,
        width: PANEL_W,
        height: PANEL_H,
        zIndex: 20,
      }}
    >
      <span
        aria-hidden
        className="absolute"
        style={{
          right: -22,
          top: 8,
          width: 22,
          height: PANEL_H - 16,
          background:
            "linear-gradient(270deg, transparent 0%, rgba(30,38,49,0.07) 42%, rgba(30,38,49,0.16) 100%)",
          filter: "blur(7px)",
          opacity: 0.48,
          zIndex: 0,
        }}
      />

      <div
        className="relative h-full w-full bg-white text-center"
        style={{
          padding: "24px 16px 0",
          zIndex: 2,
          boxShadow: "inset -1px 0 0 rgba(0,0,0,0.028)",
        }}
      >
        <StatusTag status={step.status} color={step.color} />

        <Icon
          style={{
            width: 38,
            height: 38,
            color: "#64748b",
            display: "block",
            margin: "0 auto",
          }}
          strokeWidth={1.45}
        />

        <h3
          className="uppercase"
          style={{
            margin: "16px auto 0",
            maxWidth: priorityHeading ? 124 : 116,
            color: step.color,
            fontSize: priorityHeading ? 11.3 : 9.8,
            fontWeight: 800,
            lineHeight: 1.14,
            letterSpacing: priorityHeading ? "0.1em" : "0.12em",
          }}
        >
          {step.title}
        </h3>

        <p
          style={{
            margin: "9px auto 0",
            maxWidth: 106,
            color: "#94a3b8",
            fontSize: 7.2,
            fontWeight: 500,
            lineHeight: 1.5,
            letterSpacing: "0.025em",
          }}
        >
          {step.desc}
        </p>

        <div
          className="absolute tabular-nums"
          style={{
            right: 12,
            bottom: 12,
            color: "#64748b",
            fontSize: 44,
            fontWeight: 430,
            lineHeight: 0.9,
            letterSpacing: "-0.05em",
          }}
        >
          {index + 1}
        </div>
      </div>
    </div>
  );
}

export function ProjectRoadmap() {
  const branding = useOrgBranding();
  const done = STEPS.filter((s) => s.status === "done").length;

  return (
    <section className="w-full overflow-hidden bg-white">
      <div
        className="relative mx-auto bg-white"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        <HeaderDots />

        <h2
          className="absolute left-0 right-0 text-center uppercase"
          style={{
            top: 64,
            color: "#334155",
            fontSize: 24,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "0.075em",
          }}
        >
          Wellbeing Program Roadmap
        </h2>

        <p
          className="absolute left-0 right-0 text-center uppercase"
          style={{
            top: 106,
            color: "#94a3b8",
            fontSize: 8.5,
            fontWeight: 600,
            letterSpacing: "0.45em",
          }}
        >
          {branding?.displayName ?? "ACME"} · {done}/{STEPS.length}{" "}
          achieved
        </p>

        {STEPS.map((step, index) => (
          <Chevron
            key={`${step.title}-chevron`}
            index={index}
            color={step.color}
            muted={index === STEPS.length - 1}
          />
        ))}

        {STEPS.map((step, index) => (
          <StepPanel key={step.title} step={step} index={index} />
        ))}

        <Trophy
          className="absolute"
          strokeWidth={1.45}
          style={{
            left: getPanelLeft(STEPS.length - 1) + PANEL_W + CHEVRON_W + 18,
            top: PANEL_TOP + 78,
            width: 48,
            height: 48,
            zIndex: 22,
            color: "#64748b",
          }}
        />
      </div>
    </section>
  );
}