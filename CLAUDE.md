# CLAUDE.md — b2b-dashboard (MoodScale Employer Wellbeing Dashboard)

Next.js 16 employer UI for the MoodScale **B2B** product. Reads aggregate (k≥5) insight from the GraphQL API
(`moodscale-platform/apps/api`, `http://127.0.0.1:8080/graphql`); never sees individual responses/scores/risk.

## Single source of truth (READ before changing anything)
The authoritative, code-verified docs live in the sibling repo:
- **Integrations (what external platforms are wired):** `/Users/a/Desktop/MD_June_2026/md-admin-02-Nov-2025/Understanding/B2B-Implementation-Plan/INTEGRATIONS.md`
- **Current build state / log:** `…/B2B-Implementation-Plan/IMPLEMENTATION-STATUS.md`
- **Parallel build plan + prompts:** `…/B2B-Implementation-Plan/WORKSTREAMS.md`
- **Big picture:** `…/Understanding/00-INDEX.md`

## Hard rules
1. **Local-only:** no git commit/push, no live Supabase, no deploy. Everything runs against the local stack.
2. **Integrations already wired (env-guarded — do NOT re-add the SDKs):**
   - **PostHog** product analytics → `src/components/providers.tsx` (`NEXT_PUBLIC_POSTHOG_KEY`/`_HOST`).
   - **Sentry** error tracking → `src/instrumentation-client.ts` + `src/instrumentation.ts` (`NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN`).
   Keys live in gitignored `.env.local`. See INTEGRATIONS.md before touching either.
3. **Privacy:** the UI must only render aggregate/k≥5 data + name-and-participation-status. No score/response/risk field anywhere.
4. **Verify changes:** `npx tsc --noEmit` AND `npm run build` (production build catches `useSearchParams` Suspense issues that dev hides), then check against the live API.

## Run
`npm run dev` (port 3000). Needs the GraphQL API (:8080) + local Supabase up. Login `hr@acme.test` (hr_ops, AAL2/TOTP).
