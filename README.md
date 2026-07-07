# b2b-dashboard — MoodScale Employer (HR / Leadership) Dashboard

The employer-facing surface for client companies' **HR Ops / CHRO / CEO / leadership
(and L2 managers)**. A standalone Next.js 16 app (App Router, strict TS, Tailwind),
deployed separately (DigitalOcean App Platform behind Cloudflare). It is the
`b2b-dashboard` box in `Understanding/B2B-Implementation-Plan/12-PHASE1-B2B-DASHBOARD-BUILD.md`.

> **Thin client over the API.** No business logic, no aggregation, no DB. All data
> comes from the GraphQL API (`apps/api` in `moodscale-platform`). Supabase is used
> **only for Auth** (login, session, MFA).

## What it does

- **Login → mandatory MFA (TOTP) → AAL2** before any route renders (reuses Supabase
  Auth MFA, same mechanism as md-admin). Bearer token (not cookies) to GraphQL.
- **Dashboard** with the 4 tabs — **Overview · Health & Risk · Engagement · Impact**
  — plus a **Participation Tracker**. URL-synced filters (period / department / level).
- **Privacy by construction (Iron Rule v2):** renders only what the API returns —
  **k≥5 aggregates** + **named participation status** (filled / not-filled). Never an
  individual's responses, scores, or risk. Suppressed cells show
  **"below reporting threshold"**.
- **Severity colour rule (LOCKED):** continuous gradients use green→amber→**coral**
  (never red); red (`#E84D3D`) only on **discrete employer KPI alerts** (e.g. % High
  Stress > 20%).
- **Per-org branding** via `org_branding` → Tailwind CSS variables (chrome only;
  fixed severity tokens are never re-themed).

## Run it (mock-first)

No backend needed. Mock mode serves local fixtures so the UI is buildable/verifiable
before Supabase + `apps/api` exist.

```bash
npm install
cp .env.example .env.local   # USE_MOCK=true by default; no real secrets needed
npm run dev                  # http://localhost:3000 → "Enter demo dashboard"
```

Quality gates (also run in CI — `.github/workflows/ci.yml`):

```bash
npm run typecheck   # strict TS, no errors
npm run lint        # ESLint clean (no-restricted-imports guards Supabase data use)
npm run build       # next build (ESLint + TS checks are ON — never disabled)
```

## Go live (swap mock → real API)

Set in `.env.local` (names only — never commit secrets):

| Var | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Auth (anon key only — **never** a service-role key) |
| `NEXT_PUBLIC_GRAPHQL_URL` | `apps/api` `/graphql` endpoint |
| `NEXT_PUBLIC_USE_MOCK` | `false` to hit the live API |

When `apps/api` exposes its SDL via `moodscale-platform/packages/graphql`, run
`npm run codegen` and replace the hand-authored types in `src/lib/graphql/types.ts`
with generated ones (`TODO(V-3)`).

## Hard rules honored (and md-admin anti-patterns NOT copied)

- ✅ All dashboard data via GraphQL + Bearer token; **no** `supabase.from()` / `.rpc()`.
- ✅ **No** service-role key and **no** `NEXT_PUBLIC_*` secret anywhere (CI greps for it).
- ✅ ESLint + TS build checks **ON** (md-admin disables both — we don't).
- ✅ **No** individual scores/responses/risk on any screen; suppressed = honest label.
- ✅ Every route gated on authenticated + **AAL2** + employer org membership (UX gate;
  `apps/api`'s AuthGuard is the real wall).

## Open decisions tracked as code

Followed the QA recommendations and left `TODO(QA-xx)` markers:

- **DA-1** (audience): HR + L2 + L3; L1 ICs use md-latest only — `src/lib/auth/claims.ts`.
- **D-2** (tenant resolution): from JWT `organization_id` for v1; subdomain later —
  `src/components/branding/OrgBrandingProvider.tsx`.
- **V-3** (codegen): hand-authored types until `packages/graphql` ships — `codegen.ts`.

## Layout

```
src/
  middleware.ts                 # authed + AAL2 + employer-org gate (DB-free, JWT only)
  app/
    (auth)/login, (auth)/mfa    # Supabase password login + TOTP enroll/verify
    (app)/dashboard             # 4 tabs
    (app)/participation         # Tier-2 named tracker (status only)
    forbidden/                  # non-employer landing
  lib/
    supabase/client.ts          # Auth-only browser client (anon key)
    auth/{claims,mfa}.ts        # JWT claim reads + AAL helpers
    graphql/{client,api,queries,mock,types}.ts   # Bearer transport + mock-first
    severity.ts                 # the colour rule
    hooks/                      # React Query + URL-synced filters
  components/
    auth/  layout/  branding/  dashboard/  ui/
```
