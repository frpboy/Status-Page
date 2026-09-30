# Telemetry Retention and Archive Policy

## Policy

- Retain raw `status_snapshots` for 90 days.
- Retain `daily_uptime_snapshots` and `subsystem_sla_monthly` indefinitely as compact historical summaries.
- Do not retain a separate raw-payload archive. The daily and monthly aggregates are the approved archive tier; raw payloads may contain operational metadata and are not needed for long-term reporting.
- Reassess this policy annually or before increasing probe frequency.

## Execution boundary

Raw snapshot purging is destructive. It is not performed by request handlers, Vercel Cron, or application code. A database owner must review and manually run the bounded purge procedure in `supabase/sql/manual_destructive/20260930_1146_status_snapshot_retention_MANUAL_DESTRUCTIVE.sql` after its pre-checks pass.

## Operational checks

Before each purge, verify that daily uptime rows cover the proposed deletion window and that the database backup/point-in-time recovery policy is active. Run the purge in repeated batches of at most 10,000 snapshots until no eligible rows remain, then retain the query result with the change record.
