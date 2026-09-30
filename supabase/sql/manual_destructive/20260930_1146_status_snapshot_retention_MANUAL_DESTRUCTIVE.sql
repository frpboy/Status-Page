-- MANUAL DESTRUCTIVE OPERATION: status_snapshots retention purge
-- Human database-owner execution only. AI agents and application code MUST NOT execute this file.
-- Purpose: retain 90 days of raw telemetry while preserving daily uptime and monthly SLA summaries.
-- Scope: a maximum of 10,000 raw status_snapshots per manually reviewed execution.

-- PRE-CHECK 1: Confirm the intended candidate count and date range.
SELECT
    COUNT(*) AS eligible_snapshot_count,
    MIN(created_at) AS oldest_eligible_snapshot,
    MAX(created_at) AS newest_eligible_snapshot
FROM status_snapshots
WHERE created_at < NOW() - INTERVAL '90 days';

-- PRE-CHECK 2: Confirm compact archive coverage before raw telemetry deletion.
SELECT
    MIN(date) AS earliest_daily_summary,
    MAX(date) AS latest_daily_summary,
    COUNT(*) AS daily_summary_count
FROM daily_uptime_snapshots;

-- PRE-CHECK 3: Confirm no foreign key depends on status_snapshots before proceeding.
SELECT
    conname,
    conrelid::regclass AS dependent_table
FROM pg_constraint
WHERE confrelid = 'status_snapshots'::regclass;

-- DEPENDENCY CHECK: Ensure backup/PITR is active in Neon before execution.
-- Record the database branch, backup status, pre-check output, executor, and UTC timestamp in the change record.

-- PURGE: Run only after every pre-check is reviewed. Repeat manually until deleted_count is zero.
BEGIN;
WITH candidates AS (
    SELECT id
    FROM status_snapshots
    WHERE created_at < NOW() - INTERVAL '90 days'
    ORDER BY created_at ASC, id ASC
    LIMIT 10000
), deleted AS (
    DELETE FROM status_snapshots
    WHERE id IN (SELECT id FROM candidates)
    RETURNING id
)
SELECT COUNT(*) AS deleted_count FROM deleted;
COMMIT;

-- POST-CHECK: Confirm remaining eligible rows and the active latest snapshot remain available.
SELECT COUNT(*) AS remaining_eligible_snapshot_count
FROM status_snapshots
WHERE created_at < NOW() - INTERVAL '90 days';

SELECT id, created_at, backend_status, database_status
FROM status_snapshots
ORDER BY created_at DESC, id DESC
LIMIT 1;

-- ROLLBACK GUIDANCE: DELETE is not directly reversible after COMMIT.
-- Stop if a pre- or post-check fails; recover only through the verified Neon backup/PITR process.
