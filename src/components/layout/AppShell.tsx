"use client";

import { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
// Phosphor Icons — a deliberately non-default icon pack (lucide is the shadcn/AI
// default). Rail items render regular weight when idle (crisper than duotone at
// 20px on the navy ground) and fill when active. See DESIGN-SYSTEM.md §1.
import {
  SignOut,
  UsersThree,
  ShieldCheck,
  BookOpen,
  UserPlus,
  Receipt,
  SquaresFour,
  Heartbeat,
  User,
  Pulse,
  HandHeart,
  ChartLineUp,
  Checks,
  Lightning,
  Scroll,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { useOrgBranding } from "@/components/branding/OrgBrandingProvider";
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher";
import { TopbarFilters } from "@/components/dashboard/TopbarFilters";
import { supabase } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LOGIN_PAGE } from "@/lib/auth/mfa";
import { useCapabilities } from "@/lib/hooks/useCapabilities";

// Standalone sidebar surfaces → the capability that gates them (guide/onboarding
// are always shown). A surface hides when its capability is disabled for the org.
const SURFACE_CAP: Record<string, string> = {
  "/report": "module:report",
  "/participation": "module:participation",
  "/evidence": "module:proof",
};

// The dashboard's seven sections — now the top group of the rail (replacing the
// in-body horizontal tab bar). Each links to /dashboard?tab=<id>; active state is
// derived from the `tab` query param in <RailTabs>.
const DASH_TABS: { tab: string; label: string; icon: PhosphorIcon }[] = [
  { tab: "overview", label: "Overview", icon: SquaresFour },
  { tab: "health", label: "Health & Risk", icon: Pulse },
  { tab: "engagement", label: "Engagement", icon: HandHeart },
  { tab: "impact", label: "Impact", icon: ChartLineUp },
  { tab: "verify", label: "Verify", icon: Checks },
  { tab: "act", label: "Act & Programmes", icon: Lightning },
  { tab: "govern", label: "Reports & Govern", icon: Scroll },
];

// The other top-level surfaces — the rail's bottom group (below a divider).
const SURFACES: { href: string; label: string; icon: PhosphorIcon }[] = [
  { href: "/report", label: "Health Report", icon: Heartbeat },
  { href: "/participation", label: "Participation", icon: UsersThree },
  { href: "/onboarding", label: "Onboarding", icon: UserPlus },
  { href: "/guide", label: "How it works", icon: BookOpen },
  { href: "/evidence", label: "Evidence", icon: Receipt },
];

// Phone bottom-bar nav: a single Dashboard entry + the surfaces (the seven tabs
// stay as the in-body TabNav on phones, where the rail is hidden).
const MOBILE_NAV: { href: string; label: string; icon: PhosphorIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: SquaresFour },
  ...SURFACES,
];

const NAVY = "#1E3A5F";

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * RailTooltip — the styled hover/focus label for an icon-rail item, replacing the
 * native browser `title` tooltip. A dark pill that scales in from the icon's edge
 * after a short delay (so it never flickers while the cursor runs down the rail).
 * The parent must be `group relative`; pointer-events-none so it never blocks the
 * click.
 */
function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 origin-left -translate-y-1/2 scale-90 whitespace-nowrap rounded-lg bg-slate-900/95 px-2.5 py-1.5 text-[11.5px] font-medium leading-none text-white opacity-0 shadow-[0_4px_14px_rgba(0,0,0,0.35)] transition-all duration-150 ease-out group-hover:scale-100 group-hover:opacity-100 group-hover:delay-150 group-focus-visible:scale-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

/**
 * A single icon item in the rail, shared by tabs & surfaces.
 * Active = an inverted white tile with the icon in navy (filled weight) — an
 * unmistakable "you are here". Idle icons are regular-weight at 55% white and
 * ease up to full white over a soft wash on hover; the icon itself nudges
 * brighter first so the response reads immediately even before the wash lands.
 */
function RailLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: PhosphorIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
        active
          ? "bg-white text-[#1E3A5F] shadow-[0_1px_2px_rgba(0,0,0,0.2),0_4px_12px_rgba(0,0,0,0.25)]"
          : "text-white/55 hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14]",
      )}
    >
      <Icon
        weight={active ? "fill" : "regular"}
        className="h-5 w-5 transition-transform duration-200 ease-out group-active:scale-95"
      />
      <RailTooltip label={label} />
    </Link>
  );
}

/** The seven dashboard tabs in the rail. Reads the `tab` query param for the active
 *  state, so it must be rendered inside a <Suspense> boundary. */
function RailTabs() {
  const pathname = usePathname();
  const params = useSearchParams();
  const { has } = useCapabilities();
  const onDash = pathname === "/dashboard";
  const currentTab = params.get("tab") ?? "overview";
  return (
    <>
      {DASH_TABS.filter(({ tab }) => has(`tab:${tab}`)).map(({ tab, label, icon }) => (
        <RailLink
          key={tab}
          href={`/dashboard?tab=${tab}`}
          label={label}
          icon={icon}
          active={onDash && currentTab === tab}
        />
      ))}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const branding = useOrgBranding();
  const { has } = useCapabilities();

  // The dashboard filters live in the app bar on wide screens; the body keeps a
  // fallback FilterBar below `xl` (DashboardView). Filters are dashboard-only.
  const showFilters = pathname === "/dashboard";

  async function signOut() {
    await supabase.auth.signOut();
    router.replace(LOGIN_PAGE);
  }

  const logoSrc = branding?.logoUrl ?? "/images/moodscale_logo1.png";
  const logoAlt = branding?.displayName ?? "MoodScale";

  return (
    <div className="min-h-screen">
      {/* ── Left icon rail — dark navy, icon-only, fixed full-height. Hidden on
          phones (nav moves to the bottom bar). Tablet 56px, desktop 64px. ── */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-14 flex-col items-center py-3 md:flex lg:w-16"
        style={{ backgroundColor: NAVY }}
      >
        {/* Brand mark in a white tile so the dark logo reads on the navy rail. */}
        <Link
          href="/"
          className="group relative mb-4 flex h-9 w-9 items-center justify-center rounded-[10px] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] transition-shadow duration-200 hover:shadow-[0_2px_10px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:h-10 lg:w-10"
          aria-label={logoAlt}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={32}
            height={32}
            className="h-6 w-6 object-contain lg:h-7 lg:w-7"
            priority
          />
          <RailTooltip label="Home" />
        </Link>

        {/* No overflow container here — it would clip the RailTooltip pills that
            extend past the rail's right edge. The 13 items fit the viewport. */}
        <nav className="flex flex-1 flex-col items-center gap-1.5 py-1">
          {/* Dashboard sections (the seven tabs). Suspense because RailTabs reads
              the `tab` query param via useSearchParams. */}
          <Suspense fallback={null}>
            <RailTabs />
          </Suspense>

          {/* Divider between the dashboard tabs and the other surfaces. */}
          <div className="my-2 h-px w-7 shrink-0 bg-white/12" />

          {SURFACES.filter(({ href }) => !SURFACE_CAP[href] || has(SURFACE_CAP[href])).map(({ href, label, icon }) => (
            <RailLink
              key={href}
              href={href}
              label={label}
              icon={icon}
              active={isActive(pathname, href)}
            />
          ))}
        </nav>

        <button
          onClick={signOut}
          aria-label="Sign out"
          className="group relative flex h-10 w-10 items-center justify-center rounded-[10px] text-white/55 transition-all duration-200 ease-out hover:bg-white/[0.09] hover:text-white active:bg-white/[0.14] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
        >
          <SignOut weight="regular" className="h-5 w-5" />
          <RailTooltip label="Sign out" />
        </button>
      </aside>

      {/* ── Main column — offset by the rail width on md+; full width on phones. ── */}
      <div className="md:pl-14 lg:pl-16">
        {/* Topbar — dark navy, pinned with position:fixed (NOT sticky, which can
            drift / leave a growing gap on some pages). Offset from the left by the
            rail width on md+; full width on phones. z-40 keeps it above all page
            content (some widgets use inline z-indices up to ~22). The matching
            top padding lives on <main> below so content never hides under it. */}
        <header
          className="fixed inset-x-0 top-0 z-40 flex h-14 items-center gap-3 px-4 sm:px-6 md:left-14 lg:left-16 lg:px-8"
          style={{ backgroundColor: NAVY }}
        >
          {/* Phone-only brand mark (the rail is hidden there). */}
          <Link
            href="/"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm md:hidden"
            aria-label={logoAlt}
          >
            <Image
              src={logoSrc}
              alt={logoAlt}
              width={28}
              height={28}
              className="h-5 w-5 object-contain"
              priority
            />
          </Link>

          {/* The page H1 lives in the body (each page renders its own). The topbar
              stays light: just the white-label org name as context when present. */}
          {branding?.displayName && (
            <div className="hidden min-w-0 sm:block">
              <span className="truncate text-sm font-medium text-white/80">
                {branding.displayName}
              </span>
            </div>
          )}

          {/* Workspace lens selector (Organisation ⇄ My Teams), entitlement-aware. */}
          <div className="hidden sm:block">
            <WorkspaceSwitcher />
          </div>

          {/* Dashboard filters — in the app bar on wide screens (xl+); the body
              FilterBar is the fallback below xl. Suspense because it reads
              useSearchParams. */}
          {showFilters && (
            <Suspense fallback={null}>
              <div className="hidden xl:flex">
                <TopbarFilters defaultPeriod="2026-Q2" />
              </div>
            </Suspense>
          )}

          <div className="ml-auto flex items-center gap-3">
            {/* MFA status — just the shield; reveals "MFA verified" on hover. */}
            <span
              className="group relative hidden cursor-default sm:inline-flex"
              aria-label="MFA verified"
            >
              <ShieldCheck weight="fill" className="h-[18px] w-[18px] text-severity-green" />
              <span
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full z-50 mt-2 translate-y-1 whitespace-nowrap rounded-md bg-brand-text px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100"
              >
                MFA verified
              </span>
            </span>
            {/* Sign out lives in the rail on md+; keep an icon here for phones. */}
            <button
              onClick={signOut}
              aria-label="Sign out"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-white/70 transition-colors duration-150 hover:bg-white/10 hover:text-white md:hidden"
            >
              <SignOut weight="duotone" className="h-4 w-4" />
            </button>
            {/* Account avatar — clickable: signs out (was a decorative span, so the
                profile icon appeared clickable but did nothing). */}
            <button
              onClick={signOut}
              title={`${logoAlt} · Sign out`}
              aria-label="Sign out"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors duration-150 hover:bg-white/25 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              <User weight="duotone" className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content — fluid gutters, capped only on ultra-wide. pt-20 clears the
            fixed h-14 topbar (56px) + breathing room; pb-24 on phones clears the
            fixed bottom tab bar. */}
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-24 pt-20 sm:px-6 md:pb-10 lg:px-8">
          {children}
        </main>

        {/* Watermark footer — the privacy invariant, always on screen. */}
        <footer className="mx-auto w-full max-w-[1600px] px-4 pb-24 text-center text-xs text-brand-muted sm:px-6 md:pb-6 lg:px-8">
          Employer view · aggregates (k≥5) and participation status only · never
          individual responses, scores, or risk.
        </footer>
      </div>

      {/* ── Phone bottom tab bar — replaces the rail under md. Fixed, dark navy,
          icon + tiny label, respects the iOS home-indicator safe area. ── */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around md:hidden"
        style={{
          backgroundColor: NAVY,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
        aria-label="Primary"
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[10px] font-medium transition-colors duration-150",
                active ? "text-white" : "text-white/55 hover:text-white",
              )}
            >
              <Icon weight={active ? "fill" : "regular"} className="h-5 w-5" />
              <span className="w-full truncate text-center">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
