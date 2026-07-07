import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, HAS_SUPABASE } from "@/lib/env";
import { hasEmployerAccess, readOrgClaims } from "@/lib/auth/claims";
import {
  needsMfaVerification,
  buildLoginRedirectUrl,
  buildMfaRedirectUrl,
} from "@/lib/auth/mfa";

/**
 * Route gate — modelled on md-admin `src/middleware.ts` (reuses the shape:
 * role + AAL2 gate, redirect-to-login/MFA). DB-FREE: every check reads the JWT.
 *
 * Every (app) route requires: authenticated + AAL2 (MFA) + employer org
 * membership. This is the UX gate; apps/api's AuthGuard is the real boundary.
 */

// Paths under the (app) group that must be fully gated. Every route in the
// (app) route group requires authenticated + AAL2 + employer access.
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/participation",
  "/teams",
  "/report",
  "/evidence",
  "/onboarding",
  "/guide",
];
// Auth/public paths that must remain reachable while logged out.
const PUBLIC_PREFIXES = ["/login", "/mfa", "/forbidden"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}
function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  const { pathname } = req.nextUrl;

  // Mock/demo mode (no Supabase configured): skip gating so the dashboard is
  // viewable against mock GraphQL before auth is wired. The CI build runs here.
  if (!HAS_SUPABASE) return res;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Logged-in user hitting /login or /mfa: bounce forward appropriately.
  if (user && (pathname === "/login" || pathname.startsWith("/login/"))) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (needsMfaVerification(aal)) {
      return NextResponse.redirect(new URL(buildMfaRedirectUrl("/dashboard"), req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  if (!isProtected(pathname) || isPublic(pathname)) {
    return res;
  }

  // 1) Authenticated?
  if (!user) {
    return NextResponse.redirect(
      new URL(buildLoginRedirectUrl(pathname), req.url),
    );
  }

  // 2) Employer member of an org? (else this app is not for them)
  if (!hasEmployerAccess(user)) {
    return NextResponse.redirect(new URL("/forbidden", req.url));
  }

  // 3) AAL2 (MFA) on every route — even a stolen AAL1 token can't read here.
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (needsMfaVerification(aal)) {
    return NextResponse.redirect(new URL(buildMfaRedirectUrl(pathname), req.url));
  }

  // Pass org context downstream (handy for server components / logging).
  const claims = readOrgClaims(user);
  if (claims) {
    res.headers.set("x-org-id", claims.organizationId);
    res.headers.set("x-org-role", claims.orgRole);
  }
  return res;
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next internals & static assets. The body
     * short-circuits public/auth paths itself.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
