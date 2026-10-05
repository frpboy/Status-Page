# Status-page reliability audit — October 5, 2026

## Superseding configuration and verification

The sections below record the initial audit and checks before the final internal-monitoring changes. Their authorization, POST-route and publication statements are historical. `STATUS_ADMIN_KEY` and `CRON_SECRET` are no longer required. Incident and maintenance POST handlers were removed (405); HTTP-triggered probing is retired (410), makes no upstream requests or database writes, and Vercel cron is disabled. Only the supervised daemon collects data. Snapshot, daily and monthly summaries now commit atomically. The obsolete write limiter is not a protection for any active write route.

PR #1 changes were consolidated into PR #2 and pushed. Twelve tests, lint, TypeScript, production build and hosted Quality passed; GitGuardian's mocked fixture occurrence was classified as a test credential, and its check passes. Auto-merge is enabled, pending the required independent approval. Production application deployment is still unverified. The local daemon still requires this computer to stay awake.

## Result

Collection has been restored against the existing Neon database. The corrected local dashboard is running at http://localhost:3002/. The existing production deployment also reads the fresh records, but the application changes in this checkout have not been published to production.

The collector now runs under the existing Windows PM2 supervisor as `zerpai-status-probe`, every 60 seconds. Its saved process list does not establish Windows startup or an always-on production scheduler. Sleep/shutdown will stop this collector. A permanent host remains a deployment decision.

## Verified original failure

| Evidence | Finding |
| --- | --- |
| Latest Neon snapshot before repair | October 5, 2026, 12:53:04.899 PM IST (`2026-10-05T07:23:04.899Z`) |
| Previous snapshot | September 30, 2026, 11:38:35.905 AM IST |
| Daily summary records | September 26–30 and October 5; October 1–4 absent |
| Monthly summary records | `subsystem_sla_monthly` empty |
| Local and production status API | HTTP 200 with `overallStatus: stale`, roughly four-hour-old observation |
| Backend health endpoint | HTTP 200, current operational payload during investigation |
| Vercel configuration | `0 0 * * *`, once per day |
| Production environment inventory | Neither `CRON_SECRET` nor `STATUS_ADMIN_KEY` configured |
| Local environment before repair | Both write secrets missing |
| Existing daemon | No running collector found; PM2 contained only an unrelated backup process |

September 30 security hardening made cron authentication fail closed. Without a deployed cron secret, scheduled requests cannot authenticate. Separately, the old daemon only invoked a worker URL while a local process ran; the function URL itself was not a scheduler. A daily fallback also cannot maintain the five-minute freshness requirement. These are deployment/collection faults; the observed backend was working.

The specific caller responsible for the single October 5 noon snapshot was not established. Historical gaps cannot be reconstructed as uptime or downtime from the available observations.

Vercel's current documentation confirms Hobby cron is daily, while Pro/Enterprise support minute intervals: https://vercel.com/docs/cron-jobs/usage-and-pricing . The account plan was not independently verified; the repository's configured daily schedule was verified.

## Corrections

1. Cron and daemon now use the same `executeTieredProbe` writer. Removed duplicate persistence logic and the daemon's dependence on a separately deployed public worker URL.
2. Snapshot and daily summary commit in one Neon transaction. The committed payload records Neon as operational; a failed transaction never publishes that payload.
3. Every collector path refreshes current-month service observations. SLA errors remain visible as failed probe results, rather than silently succeeding.
4. HTTP reachability alone no longer counts degraded/unknown health as a successful health check. Missing service evidence stays unknown. Confirmed edge HTTP 5xx is an outage and affects overall status.
5. Added bounded backend, edge, and Neon timeouts. The daemon does not overlap cycles. Backend latency excludes the separate edge request.
6. Both read APIs propagate stale/invalid evidence to component badges. Future/invalid observation ages cannot establish health.
7. Overview now includes the actual observation timestamp, current-month check counts, incident updates, current/upcoming maintenance, and a true 90-day history window.
8. Daily dates are explicit UTC strings, avoiding the observed date-to-timestamp conversion that shifted dates by one day when parsed by the browser.
9. The UI displays observation times in IST, refreshes summaries every minute, shows read failures, preserves zero-percent days, uses weighted successful/total checks, and labels missing coverage as unknown.
10. Removed hardcoded healthy details for Neon, ECS task counts, storage, connections, bastion state, and HTTPS. Empty incident reports no longer imply verified infrastructure health.
11. Removed the CI secret scan's fixed base/head overrides, which fail when both resolve to the same commit. Existing action pins remain intact.
12. Corrected README/TRD descriptions that claimed automatic schema creation, green stale banners, synthetic SLA fallbacks, or automatically continuous function scheduling.
13. Generated distinct local write secrets in ignored `.env.local`; values were not printed or committed. Unauthenticated writes still fail closed.

## Repository coverage

Reviewed all tracked application routes, client page, layout/icon/styles, DB driver, security/freshness/SLA helpers, worker and daemon, tests, package/lockfile configuration, Next/TypeScript/ESLint/Tailwind configuration, Vercel scheduling, CI, migration and manual-retention SQL, README, and all existing documents under `docs/`. Reviewed Git status, branch/history/blame and relevant collector/authentication changes. Initial worktree was clean; no Git reset, cleanup, migration, purge, or schema alteration was performed.

The previously referenced `Status_page_app_current_scheama.md` is absent from this checkout. Existing schema was checked against ERD/migration artifacts and read-only Neon `information_schema` results before changing queries. All eight expected tables and the columns used by these changes were present. Existing records were preserved; new writes are genuine observations and derived current-month summaries.

## Verification

- Tests: 16 passing; regression checks demonstrated stale component badges, invalid timestamps, degraded HTTP 200 counting, and edge HTTP 503 classification failing before their fixes.
- ESLint and TypeScript checking passed. Production Next.js build passed. Production dependency audit reported zero vulnerabilities.
- Local status, overview, history, incidents, maintenance, alerts, latency, SLA, and badge routes checked during repair.
- Local cron: 401 without authorization; 200 with generated local authorization, `neonLogged: true`, `slaUpdated: true`.
- Authenticated invalid incident input: 400, without creating an incident.
- Neon: successive snapshots approximately 60 seconds apart, committed operational Neon status, and real October monthly service rows.
- Local and existing production status endpoints returned operational with a fresh shared snapshot at `2026-10-05T11:49:49.008Z` (5:19:49 PM IST).
- Chrome verified the local observation timestamp, operational Neon badge, monthly sample counts, and explicit coverage-gap wording.

Build warnings remain for the repository boundary's parent lockfile and deprecated edge icon runtime; neither prevented the build. An encoding error introduced during an intermediate edit was corrected before the passing verification.

## Remaining boundaries

- Production publication and server-only secret configuration are still required for the corrected application/fallback. The Vercel CLI is authenticated; its connector requires reauthentication. No production deployment or environment change was made in this turn.
- Permanent collection cannot rely on this PC sleeping less often. Select an existing always-on host, or a hosting plan with suitable scheduling. The collector is runnable now and needs no new dependency.
- Monthly/current daily percentages describe recorded checks, not continuous time coverage or contractual SLA proof. No fabricated backfill was performed.
- The incident-plus-update POST remains two statements; partial persistence is possible if the second statement fails. This did not cause the monitoring stoppage and was not exercised with fabricated production incidents.
- The write limiter remains process-local, and public payloads expose infrastructure metadata. Durable rate limiting and publication scope need a separate deployment/security decision.
- Raw retention remains a manual procedure. No destructive retention SQL was run.
- CI YAML was corrected locally; a hosted CI run was not triggered. No commits, pushes, or merges were performed.
