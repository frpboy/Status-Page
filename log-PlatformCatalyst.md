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
