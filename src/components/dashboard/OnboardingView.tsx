"use client";

import { useMemo, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import {
  Panel,
  SectionHeader,
  MicroLabel,
  CellTitle,
  Foot,
  BandDot,
  PanelSkeleton,
} from "@/components/ui/panels";
import { Dropdown } from "@/components/ui/Dropdown";
import { GraphqlAuthError } from "@/lib/graphql/client";
import { cn } from "@/lib/utils";
import {
  useFilterOptions,
  useOrgRoster,
  useProvisionMembers,
  usePendingInvites,
  useResendInvite,
  useRevokeInvite,
  useSendInvite,
  useSendAllPendingInvites,
} from "@/lib/hooks/useDashboardData";
import { SEVERITY } from "@/lib/severity";
import type {
  ProvisionMemberInput,
  ProvisionResult,
  RosterMember,
  AssignableRole,
  PendingInvite,
  InviteActionResult,
} from "@/lib/graphql/types";

/**
 * Onboarding & roster — identity administration only (names, work emails,
 * departments, levels). No wellbeing data is entered or shown here.
 *
 * Visual language (matches the redesigned Act / Overview tabs): typography-led,
 * near-monochrome slate with navy (#1E3A5F) as the single interactive accent.
 * Severity colour appears only on data (status dots, per-row validation) —
 * never as chrome. The roster is a ledger: one panel, a micro-label column
 * header, hairline-divided rows.
 */

type Level = "L1" | "L2" | "L3";

const LEVEL_OPTIONS = [
  { value: "L1", label: "L1 — Individual Contributor" },
  { value: "L2", label: "L2 — Manager" },
  { value: "L3", label: "L3 — Senior Leader" },
];

const ROLE_OPTIONS = [
  { value: "employee", label: "Employee" },
  { value: "manager", label: "Manager" },
  { value: "hr_ops", label: "HR Ops" },
  { value: "wellbeing_committee", label: "Wellbeing Committee" },
];

const ROLE_VALUES = ROLE_OPTIONS.map((r) => r.value);

function normalizeRole(raw: string): AssignableRole | null {
  const v = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return (ROLE_VALUES.includes(v) ? v : null) as AssignableRole | null;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ── page-specific primitives (shared ones live in @/components/ui/panels) ── */

const INPUT_CLS =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/15";

/** The single filled-navy primary action (one per cell at most). */
function PrimaryButton({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-[#1E3A5F] px-3.5 py-1.5 text-[13px] font-medium text-white transition-colors hover:bg-[#2a4a73] disabled:bg-slate-100 disabled:text-slate-400"
    >
      {children}
    </button>
  );
}

/** Quiet navy text-button (the Act tab's "Book" pattern). */
function TextButton({
  children,
  onClick,
  disabled,
  muted,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  muted?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-lg px-2 py-1 text-[12.5px] font-medium transition-colors disabled:text-slate-300 disabled:hover:bg-transparent",
        muted
          ? "text-slate-400 hover:bg-slate-100/80 hover:text-slate-600"
          : "text-[#1E3A5F] hover:bg-[#1E3A5F]/[0.05]",
      )}
    >
      {children}
    </button>
  );
}

export function OnboardingView() {
  const { data: opts } = useFilterOptions();
  const roster = useOrgRoster();
  const provision = useProvisionMembers();

  const deptOptions = useMemo(
    () => [
      { value: "", label: "No department" },
      ...((opts?.departments ?? []).map((d) => ({ value: d.id, label: d.label }))),
    ],
    [opts],
  );

  return (
    <div className="space-y-8 pb-2">
      <header className="px-1 pt-1">
        <MicroLabel>People &amp; access</MicroLabel>
        <h2 className="mt-1.5 text-[22px] font-semibold leading-7 tracking-[-0.02em] text-slate-900">
          Onboarding &amp; roster
        </h2>
        <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-slate-500">
          Add employees to the roster and issue invites. Names and emails only — no wellbeing data
          is entered or shown here.
        </p>
      </header>

      {/* ── Add people — single add + CSV, one hairline-divided panel ────── */}
      <section className="space-y-3">
        <SectionHeader title="Add people" meta="identity only — name, email, department, level" />
        <Panel className="grid lg:grid-cols-2">
          <div className="border-b border-slate-100 p-6 lg:border-b-0 lg:border-r">
            <SingleAddCell
              deptOptions={deptOptions}
              submitting={provision.isPending}
              onSubmit={(row) => provision.mutateAsync([row])}
            />
          </div>
          <div className="p-6">
            <CsvImportCell
              departments={opts?.departments ?? []}
              submitting={provision.isPending}
              onSubmit={(rows) => provision.mutateAsync(rows)}
            />
          </div>
        </Panel>
      </section>

      {/* ── Roster ledger ────────────────────────────────────────────────── */}
      <RosterSection
        loading={roster.isLoading}
        error={roster.isError ? roster.error : null}
        onRetry={() => void roster.refetch()}
        rows={roster.data ?? []}
      />

      {/* ── Notes colophon ───────────────────────────────────────────────── */}
      <footer className="space-y-2 border-t border-slate-200/70 px-1 pt-5">
        <MicroLabel>Notes</MicroLabel>
        <ul className="space-y-1.5 text-[12.5px] leading-relaxed text-slate-500">
          <li>
            <span className="font-medium text-slate-700">Identity only.</span>{" "}
            The roster stores name, work email, department, and level. No assessment, score, or
            response is ever stored or shown on this page.
          </li>
          <li>
            <span className="font-medium text-slate-700">Invite links.</span>{" "}
            Shown only to HR for delivery; an accepted or revoked link stops working.
          </li>
        </ul>
      </footer>
    </div>
  );
}

function inviteLink(token: string): string {
  if (typeof window === "undefined") return token;
  return `${window.location.origin.replace(/:\d+$/, ":3001")}/auth/org-invite/${token}`;
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[12.5px] font-medium text-[#1E3A5F] transition-colors hover:bg-[#1E3A5F]/[0.05]"
    >
      {copied && <Check className="h-3.5 w-3.5" style={{ color: SEVERITY.green }} />}
      {copied ? "Copied" : label}
    </button>
  );
}

function ResultRow({ r }: { r: ProvisionResult }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
      <div className="flex min-w-0 items-baseline gap-2 text-[13px] leading-5">
        {r.ok ? (
          <Check className="h-3.5 w-3.5 shrink-0 self-center" style={{ color: SEVERITY.green }} />
        ) : (
          <X className="h-3.5 w-3.5 shrink-0 self-center" style={{ color: SEVERITY.red }} />
        )}
        <span className="truncate font-medium text-slate-900">{r.fullName || r.email}</span>
        {r.employeeRef && (
          <span className="text-[11.5px] tabular-nums text-slate-400">{r.employeeRef}</span>
        )}
        {!r.ok && r.error && (
          <span className="text-[12px]" style={{ color: SEVERITY.red }}>
            {r.error}
          </span>
        )}
      </div>
      {r.ok && r.inviteToken && (
        <CopyButton value={inviteLink(r.inviteToken)} label="Copy invite link" />
      )}
    </div>
  );
}

/* ── Add an employee ─────────────────────────────────────────────────────── */

function SingleAddCell({
  deptOptions,
  submitting,
  onSubmit,
}: {
  deptOptions: { value: string; label: string }[];
  submitting: boolean;
  onSubmit: (row: ProvisionMemberInput) => Promise<ProvisionResult[]>;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [level, setLevel] = useState<Level>("L1");
  const [role, setRole] = useState<AssignableRole>("employee");
  const [result, setResult] = useState<ProvisionResult | null>(null);

  const emailValid = email === "" || EMAIL_RE.test(email);
  const canSubmit = fullName.trim() !== "" && EMAIL_RE.test(email) && !submitting;

  async function submit() {
    const out = await onSubmit({
      fullName: fullName.trim(),
      email: email.trim(),
      departmentId: department || null,
      level,
      orgRole: role,
    });
    const r = out[0] ?? null;
    setResult(r);
    if (r?.ok) {
      setFullName("");
      setEmail("");
      setDepartment("");
      setLevel("L1");
      setRole("employee");
    }
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <CellTitle>Add an employee</CellTitle>

      <div className="grid grid-cols-1 gap-3.5">
        <Field label="Full name">
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Asha Rao"
            className={INPUT_CLS}
          />
        </Field>
        <Field label="Work email">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="asha@company.com"
            className={INPUT_CLS}
            style={emailValid ? undefined : { borderColor: SEVERITY.red }}
          />
        </Field>
        <Field label="Department">
          <Dropdown value={department} options={deptOptions} onChange={setDepartment} minWidth={0} />
        </Field>
        <div className="grid grid-cols-2 gap-3.5">
          <Field label="Level">
            <Dropdown value={level} options={LEVEL_OPTIONS} onChange={(v) => setLevel(v as Level)} minWidth={0} />
          </Field>
          <Field label="Role">
            <Dropdown value={role} options={ROLE_OPTIONS} onChange={(v) => setRole(v as AssignableRole)} minWidth={0} />
          </Field>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-4 pt-1">
        <Foot>An invite token is issued on add.</Foot>
        <PrimaryButton onClick={submit} disabled={!canSubmit}>
          {submitting ? "Adding…" : "Add & invite"}
        </PrimaryButton>
      </div>

      {result && (
        <div className="border-t border-slate-100 pt-2">
          <ResultRow r={result} />
        </div>
      )}
    </div>
  );
}

/* ── Bulk upload (CSV) ───────────────────────────────────────────────────── */

interface ParsedRow {
  fullName: string;
  email: string;
  departmentLabel: string;
  departmentId: string | null;
  level: Level;
  role: AssignableRole;
  roleLabel: string;
  valid: boolean;
  reason: string | null;
}

function parseCsv(
  text: string,
  departments: { id: string; label: string }[],
): ParsedRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length === 0) return [];

  const splitLine = (l: string) =>
    l.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));

  const header = splitLine(lines[0] ?? "").map((h) => h.toLowerCase());
  const hasHeader = header.includes("email") || header.includes("name") || header.includes("full name");
  const idx = {
    name: header.findIndex((h) => h === "name" || h === "full name"),
    email: header.indexOf("email"),
    department: header.findIndex((h) => h === "department" || h === "dept"),
    level: header.indexOf("level"),
    role: header.indexOf("role"),
  };
  const body = hasHeader ? lines.slice(1) : lines;

  const deptByLabel = new Map(departments.map((d) => [d.label.toLowerCase(), d.id]));

  return body.map((line) => {
    const cols = splitLine(line);
    const get = (i: number) => (i >= 0 && i < cols.length ? cols[i] : "");
    const fullName = (hasHeader ? get(idx.name) : cols[0]) || "";
    const email = (hasHeader ? get(idx.email) : cols[1]) || "";
    const departmentLabel = (hasHeader ? get(idx.department) : cols[2]) || "";
    const rawLevel = ((hasHeader ? get(idx.level) : cols[3]) || "L1").toUpperCase();
    const level = (["L1", "L2", "L3"].includes(rawLevel) ? rawLevel : "L1") as Level;
    const rawRole = (hasHeader ? get(idx.role) : cols[4]) || "";
    const role = rawRole ? normalizeRole(rawRole) : "employee";

    const departmentId = departmentLabel
      ? deptByLabel.get(departmentLabel.toLowerCase()) ?? null
      : null;

    let valid = true;
    let reason: string | null = null;
    if (fullName.trim() === "") {
      valid = false;
      reason = "Missing name";
    } else if (!EMAIL_RE.test(email)) {
      valid = false;
      reason = "Invalid email";
    } else if (departmentLabel && !departmentId) {
      valid = false;
      reason = `Unknown department "${departmentLabel}"`;
    } else if (rawRole && role === null) {
      valid = false;
      reason = `Unknown role "${rawRole}"`;
    }

    return {
      fullName,
      email,
      departmentLabel,
      departmentId,
      level,
      role: role ?? "employee",
      roleLabel: rawRole || "employee",
      valid,
      reason,
    };
  });
}

function sampleCsv(departments: { id: string; label: string }[]): string {
  const names = departments.map((d) => d.label);
  const pick = (i: number) => names[i % names.length] ?? "Engineering";
  const rows = [
    ["name", "email", "department", "level", "role"],
    ["Asha Rao", "asha.rao@example.com", pick(0), "L1", "employee"],
    ["Ravi Kumar", "ravi.kumar@example.com", pick(1), "L2", "manager"],
    ["Maya Singh", "maya.singh@example.com", pick(2), "L3", "employee"],
  ];
  return rows
    .map((r) => r.map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(","))
    .join("\n");
}

function downloadSample(departments: { id: string; label: string }[]) {
  const blob = new Blob([sampleCsv(departments)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "moodscale_roster-sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function CsvImportCell({
  departments,
  submitting,
  onSubmit,
}: {
  departments: { id: string; label: string }[];
  submitting: boolean;
  onSubmit: (rows: ProvisionMemberInput[]) => Promise<ProvisionResult[]>;
}) {
  const [text, setText] = useState("");
  const [results, setResults] = useState<ProvisionResult[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseCsv(text, departments), [text, departments]);
  const validRows = parsed.filter((r) => r.valid);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    file.text().then(setText);
  }

  async function importRows() {
    const out = await onSubmit(
      validRows.map((r) => ({
        fullName: r.fullName,
        email: r.email,
        departmentId: r.departmentId,
        level: r.level,
        orgRole: r.role,
      })),
    );
    setResults(out);
    setText("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <CellTitle
        state={
          <TextButton onClick={() => downloadSample(departments)}>Sample CSV</TextButton>
        }
      >
        Bulk upload (CSV)
      </CellTitle>

      <p className="text-[12.5px] leading-relaxed text-slate-500">
        Columns: <span className="font-medium text-slate-700">name, email, department, level, role</span>.
        Role is optional (defaults to employee). A header row is optional. Departments must match
        your org&apos;s names.
      </p>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        onChange={onFile}
        className="block w-full text-[12px] text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-slate-600 hover:file:bg-slate-200/70"
      />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        placeholder={"name,email,department,level,role\nAsha Rao,asha@company.com,Engineering,L2,manager"}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 font-mono text-[12px] leading-5 text-slate-900 placeholder:text-slate-300 outline-none transition-colors focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/15"
      />

      {parsed.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <BandDot color={SEVERITY.green} label={`${validRows.length} valid`} />
            {parsed.length - validRows.length > 0 && (
              <BandDot color={SEVERITY.red} label={`${parsed.length - validRows.length} skipped`} />
            )}
          </div>
          <div className="max-h-44 divide-y divide-slate-100 overflow-auto">
            {parsed.map((r, i) => (
              <div key={i} className="flex items-baseline gap-2.5 py-1.5 text-[12.5px] leading-5">
                {r.valid ? (
                  <Check
                    className="h-3.5 w-3.5 shrink-0 self-center"
                    style={{ color: SEVERITY.green }}
                  />
                ) : (
                  <X className="h-3.5 w-3.5 shrink-0 self-center" style={{ color: SEVERITY.red }} />
                )}
                <span className="min-w-0 truncate font-medium text-slate-900">
                  {r.fullName || "—"}
                </span>
                <span className="min-w-0 truncate text-slate-500">{r.email || "—"}</span>
                <span className="hidden truncate text-slate-400 sm:inline">
                  {r.departmentLabel || "—"} · {r.level} · {r.role}
                </span>
                {r.reason && (
                  <span className="ml-auto shrink-0 text-[12px]" style={{ color: SEVERITY.red }}>
                    {r.reason}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-auto flex items-center justify-end pt-1">
        <PrimaryButton onClick={importRows} disabled={validRows.length === 0 || submitting}>
          {submitting ? "Importing…" : `Import ${validRows.length} row${validRows.length === 1 ? "" : "s"}`}
        </PrimaryButton>
      </div>

      {results && results.length > 0 && (
        <div className="border-t border-slate-100 pt-2">
          <p className="text-[12px] font-medium tabular-nums text-slate-500">
            {results.filter((r) => r.ok).length} added · {results.filter((r) => !r.ok).length} failed
          </p>
          <div className="mt-1 max-h-56 divide-y divide-slate-100 overflow-auto">
            {results.map((r, i) => (
              <ResultRow key={i} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Roster ledger ───────────────────────────────────────────────────────── */

// No amber/orange: active = green, invited (awaiting) = navy, suspended (flagged)
// = red, offboarded = muted slate.
const MEMBER_STATUS_COLOR: Record<string, string> = {
  active: SEVERITY.green,
  invited: "var(--brand-primary)",
  suspended: SEVERITY.red,
  offboarded: "var(--brand-muted)",
};

function inviteState(r: RosterMember) {
  if (r.linked) return <BandDot color={SEVERITY.green} label="Linked" />;
  if (r.inviteStatus === "accepted") return <BandDot color={SEVERITY.green} label="Accepted" />;
  return (
    <BandDot color="var(--brand-primary)" label={`Invite ${r.inviteStatus ?? "pending"}`} />
  );
}

function deliveryMessage(r: InviteActionResult): string {
  if (!r.ok) return r.error ?? "Action failed.";
  if (r.action === "revoked") return "Invite revoked.";
  if (r.delivered) return "Email delivered.";
  if (r.parked) return "Email parked (no provider) — use Copy link to deliver manually.";
  return r.error ? `Not delivered: ${r.error}` : "Done.";
}

function exportInviteLinks(invites: PendingInvite[]) {
  const head = ["name", "email", "invite_link", "expires_at"];
  const lines = invites.map((i) =>
    [i.fullName ?? "", i.email, i.link, i.expiresAt ?? ""]
      .map((v) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v))
      .join(","),
  );
  const blob = new Blob([[head.join(","), ...lines].join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "moodscale_pending-invites.csv";
  a.click();
  URL.revokeObjectURL(url);
}

const ROSTER_COLS =
  "md:grid md:grid-cols-[minmax(0,1fr)_44px_150px_100px_150px_minmax(210px,auto)] md:items-center md:gap-4";

/**
 * The API + DB guard roster reads to HR Ops / org admin (identity PII). A
 * "Role … not permitted" / forbidden error is an entitlement fact, not a
 * transient failure — say so honestly instead of offering a useless retry.
 */
function isPermissionError(err: unknown): boolean {
  if (err instanceof GraphqlAuthError && err.kind === "forbidden") return true;
  return err instanceof Error && /not permitted|forbidden/i.test(err.message);
}

function RosterSection({
  loading,
  error,
  onRetry,
  rows,
}: {
  loading: boolean;
  error: unknown;
  onRetry: () => void;
  rows: RosterMember[];
}) {
  const pendingQ = usePendingInvites();
  const resend = useResendInvite();
  const revoke = useRevokeInvite();
  const send = useSendInvite();
  const sendAll = useSendAllPendingInvites();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const pendingByMember = useMemo(
    () => new Map((pendingQ.data ?? []).map((p) => [p.memberId, p])),
    [pendingQ.data],
  );

  async function run(memberId: string, fn: () => Promise<InviteActionResult>) {
    setBusyId(memberId);
    setFeedback(null);
    try {
      const r = await fn();
      setFeedback({ ok: r.ok, msg: deliveryMessage(r) });
    } catch {
      setFeedback({ ok: false, msg: "Something went wrong." });
    } finally {
      setBusyId(null);
    }
  }

  async function runSendAll() {
    setBusyId("__all__");
    setFeedback(null);
    try {
      const out = await sendAll.mutateAsync();
      const delivered = out.filter((r) => r.delivered).length;
      const parked = out.filter((r) => r.parked).length;
      const failed = out.filter((r) => !r.delivered && !r.parked).length;
      setFeedback({
        ok: failed === 0,
        msg: `Sent ${out.length}: ${delivered} delivered, ${parked} parked${failed ? `, ${failed} failed` : ""}${parked || failed ? " — use Export links / Copy link to deliver the rest" : ""}.`,
      });
    } catch {
      setFeedback({ ok: false, msg: "Bulk send failed." });
    } finally {
      setBusyId(null);
    }
  }

  const pendingList = pendingQ.data ?? [];
  const linked = rows.filter((r) => r.linked).length;

  return (
    <section className="space-y-3">
      <SectionHeader
        title="Roster"
        meta={
          !loading && !error
            ? `${rows.length} ${rows.length === 1 ? "person" : "people"} · ${linked} linked${pendingList.length > 0 ? ` · ${pendingList.length} pending invite${pendingList.length === 1 ? "" : "s"}` : ""}`
            : undefined
        }
      />
      {loading ? (
        <PanelSkeleton className="h-64" />
      ) : error ? (
        <Panel className="px-6 py-8">
          {isPermissionError(error) ? (
            <p className="max-w-xl text-[12.5px] leading-relaxed text-slate-400">
              Roster administration is limited to HR Ops and org admin accounts, so the roster
              isn&apos;t shown for your current role. No wellbeing data lives here — only names,
              work emails, departments, and levels.
            </p>
          ) : (
            <p className="max-w-xl text-[12.5px] leading-relaxed text-slate-400">
              The roster didn&apos;t load.{" "}
              <button
                type="button"
                onClick={onRetry}
                className="font-medium text-[#1E3A5F] hover:underline"
              >
                Retry
              </button>
            </p>
          )}
        </Panel>
      ) : (
        <Panel className="overflow-hidden">
          {pendingList.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-slate-100 px-6 py-3">
              <span className="text-[12.5px] text-slate-500">
                {pendingList.length} invite{pendingList.length === 1 ? "" : "s"} awaiting delivery
              </span>
              <span className="flex items-center gap-1">
                <TextButton onClick={runSendAll} disabled={busyId === "__all__"}>
                  {busyId === "__all__" ? "Sending…" : `Send all (${pendingList.length})`}
                </TextButton>
                <TextButton onClick={() => exportInviteLinks(pendingList)}>
                  Export links
                </TextButton>
              </span>
            </div>
          )}

          {feedback && (
            <p
              className="border-b border-slate-100 px-6 py-2.5 text-[12.5px] font-medium"
              style={{ color: feedback.ok ? SEVERITY.green : SEVERITY.red }}
            >
              {feedback.msg}
            </p>
          )}

          {rows.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13.5px] font-medium text-slate-900">No one on the roster yet</p>
              <p className="mx-auto mt-1 max-w-md text-[12.5px] leading-relaxed text-slate-400">
                Add an employee or import a CSV above — each person gets an invite token on add.
              </p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "hidden border-b border-slate-100 px-6 py-2.5 md:grid",
                  ROSTER_COLS.replace("md:grid ", ""),
                )}
              >
                <MicroLabel>Employee</MicroLabel>
                <MicroLabel>Level</MicroLabel>
                <MicroLabel>Department</MicroLabel>
                <MicroLabel>Member</MicroLabel>
                <MicroLabel>Invite</MicroLabel>
                <span />
              </div>
              <div className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <RosterRow
                    key={r.memberId}
                    r={r}
                    pending={pendingByMember.get(r.memberId)}
                    busy={busyId === r.memberId}
                    onSend={() =>
                      run(r.memberId, () => send.mutateAsync(r.memberId) as Promise<InviteActionResult>)
                    }
                    onResend={() =>
                      run(r.memberId, () => resend.mutateAsync(r.memberId) as Promise<InviteActionResult>)
                    }
                    onRevoke={() =>
                      run(r.memberId, () => revoke.mutateAsync(r.memberId) as Promise<InviteActionResult>)
                    }
                  />
                ))}
              </div>
            </>
          )}

          <div className="border-t border-slate-100 px-6 py-3.5">
            <Foot>
              Roster identity only (name, work email, department, level). No assessment, score, or
              response is ever stored or shown on this page. Invite links are shown only to HR for
              delivery; an accepted or revoked link stops working.
            </Foot>
          </div>
        </Panel>
      )}
    </section>
  );
}

function RosterRow({
  r,
  pending,
  busy,
  onSend,
  onResend,
  onRevoke,
}: {
  r: RosterMember;
  pending: PendingInvite | undefined;
  busy: boolean;
  onSend: () => void;
  onResend: () => void;
  onRevoke: () => void;
}) {
  const statusColor = MEMBER_STATUS_COLOR[r.memberStatus] ?? "var(--brand-muted)";
  return (
    <div className={cn("flex flex-col gap-2 px-6 py-3.5", ROSTER_COLS)}>
      <div className="min-w-0">
        <p className="truncate text-[13.5px] font-medium leading-5 text-slate-900">
          {r.fullName ?? "—"}
        </p>
        <p className="mt-0.5 truncate text-[11.5px] leading-4 tabular-nums text-slate-400">
          {r.employeeRef}
        </p>
      </div>

      <span className="text-[12.5px] tabular-nums text-slate-500">{r.level}</span>

      <span className="truncate text-[12.5px] text-slate-500">{r.department ?? "—"}</span>

      <BandDot
        color={statusColor}
        label={r.memberStatus.charAt(0).toUpperCase() + r.memberStatus.slice(1)}
      />

      <div className="min-w-0">
        {inviteState(r)}
        {pending && pending.sendCount > 0 && (
          <p className="mt-0.5 text-[11px] leading-4 tabular-nums text-slate-400">
            sent {pending.sendCount}×
            {pending.lastSentAt ? ` · ${new Date(pending.lastSentAt).toLocaleDateString()}` : ""}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-0.5 md:justify-end">
        {r.linked ? (
          <span className="px-2 text-[12px] text-slate-300">—</span>
        ) : (
          <>
            {pending && (
              <>
                <TextButton onClick={onSend} disabled={busy}>
                  Send
                </TextButton>
                <CopyButton value={pending.link} label="Copy link" />
              </>
            )}
            <TextButton onClick={onResend} disabled={busy}>
              Resend
            </TextButton>
            {pending && (
              <TextButton onClick={onRevoke} disabled={busy} muted>
                Revoke
              </TextButton>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <MicroLabel>{label}</MicroLabel>
      {children}
    </label>
  );
}
