## 1) [2026-09-30 11:32:38 +05:30] Status Page Security and Release Hardening

Scope & Implementation: Reinforced authenticated write boundaries for incidents, maintenance, and cron probes; added request schemas and rate limiting; made latest status timestamp-ordered and unknown/stale-safe; replaced request-time DDL with reviewed versioned migration SQL; upgraded the Next.js, React, PostCSS, TypeScript, and lint/test toolchain; and added GitHub Actions quality and secret-scanning gates.

Files modified: `.env.example`, `README.md`, `app/api/*`, `app/page.tsx`, `functions/probe-worker.ts`, `lib/api-security.ts`, `lib/status-truth.ts`, `migrations/0001_status_page_schema.sql`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.github/workflows/quality.yml`, and this log.

Verification: Isolated clean-lockfile verification completed TypeScript checking, ESLint, 10 unit tests, Next.js 16.3.7 production build, and production dependency audit with zero vulnerabilities. The active local `node_modules` remains unavailable for direct verification because a pre-existing Next development process holds its native binary lock.

Timestamp of Log Update: 30 September 2026 at 11:32 AM (IST)

## 2) [2026-09-30 11:46:55 +05:30] Telemetry Retention Policy and Authoritative SLA Rollup

Scope & Implementation: Added a 90-day raw telemetry retention policy with indefinite compact daily/monthly summary retention and a human-only bounded purge procedure. Added the scheduled current-month SLA rollup, which uses only authoritative service observations and excludes unknown/stale evidence. Pinned all CI actions to verified commit SHAs.

Files modified: `app/api/cron/probe/route.ts`, `lib/sla-aggregation.ts`, `tests/status-truth.test.ts`, `docs/RETENTION_POLICY.md`, `supabase/sql/manual_destructive/20260930_1146_status_snapshot_retention_MANUAL_DESTRUCTIVE.sql`, `.github/workflows/quality.yml`, and this log.

Verification: SLA behavior was developed test-first: the new tests failed before the aggregation helper existed and pass after implementation. The destructive retention SQL was generated for manual database-owner review only and was not executed.

Timestamp of Log Update: 30 September 2026 at 11:46 AM (IST)


## 3) [5 October 2026 at 5:23 pm IST] Restore continuous collection and truthful monitoring display

Root cause: production/local cron secrets were absent, the Vercel fallback runs daily, and no continuous collector was running. Neon originally ended at October 5 12:53:04 PM IST with October 1-4 unobserved and no monthly summaries.

Implementation: unified cron/daemon writer, atomic snapshot/daily persistence, committed Neon status, monthly rollup, bounded requests, health-aware check success, stale component badges, explicit UTC history dates and IST observation timestamps, summary refresh/error handling, real component values, coverage-aware reporting, CI scan correction and current operational documentation. Generated local ignored write secrets and started the 60-second collector under existing PM2.

Files modified: .github/workflows/quality.yml, README.md, app/api/cron/probe/route.ts, app/api/history/route.ts, app/api/incidents/route.ts, app/api/overview/route.ts, app/api/status/route.ts, app/page.tsx, docs/TRD.md, functions/probe-worker.ts, lib/db.ts, lib/sla-aggregation.ts, lib/status-truth.ts, package.json, scripts/continuous-probe.js, tests/status-truth.test.ts, tests/probe.test.ts, docs/2026-10-05-RELIABILITY-AUDIT.md and this append-only log.

Verification: 16 tests pass, lint/typecheck pass, production build passes, dependency audit has zero vulnerabilities; authenticated local cron returns 200 with snapshot and SLA persistence, unauthenticated cron returns 401, invalid incident input returns 400. Successive Neon records and local/production reads verify restored freshness; Chrome verifies corrected local display. No migrations, destructive SQL, historical backfill, commits, pushes, or production publication. Remaining host/publication/security boundaries are recorded in docs/2026-10-05-RELIABILITY-AUDIT.md.

Timestamp of Log Update: 5 October 2026 at 5:23 pm (IST)


## 4) [5 October 2026 at 5:29 pm IST] Remove unused manual publication and probe secret dependencies

User explicitly requested removing STATUS_ADMIN_KEY and CRON_SECRET because this dashboard needs no manual alert publication. Removed secret checks from cron and worker, removed incident/maintenance POST handlers and their now-unused authorization/payload helpers, and retained read endpoints and probe rate limiting. Removed the two keys from .env.example and existing local environment files without exposing other values. Updated current README/TRD; prior audit entries remain historical.

Files modified: .env.example, README.md, docs/TRD.md, app/api/cron/probe/route.ts, app/api/incidents/route.ts, app/api/maintenances/route.ts, functions/probe-worker.ts, lib/api-security.ts, tests/security.test.ts, tests/probe.test.ts, ignored local .env files, and this log.

Verification: 11 applicable tests pass; ESLint and TypeScript pass; local cron accepts a request without authorization and commits real telemetry; manual POST routes return 405 while history GETs remain available. Production deployment is unchanged.

Timestamp of Log Update: 5 October 2026 at 5:29 pm (IST)
## 3) [2026-09-30 11:51:13 +05:30] Correct Quality Secret-Scan Event Range

Scope & Implementation: Removed explicit `base` and `head` inputs from the pinned TruffleHog action after GitHub Actions evidence showed that both resolved to the same checkout on push events. The action now derives the correct event commit range itself.

Files modified: `.github/workflows/quality.yml` and this log.

Verification: GitHub Actions run `36677620580` established the root cause: TruffleHog rejected the equal base/head commits before scanning. The corrected workflow will be verified by the pull-request Quality run.

Timestamp of Log Update: 30 September 2026 at 11:51 AM (IST)
