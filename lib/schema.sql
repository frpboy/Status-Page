-- ========================================================
-- Zerpai Status Page - Neon PostgreSQL DDL Migration Schema
-- Execute this SQL in Neon Console / Query Editor
-- ========================================================

-- 1. Snapshot ping history (Recorded by Vercel Cron every 5-15 min)
CREATE TABLE IF NOT EXISTS status_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    backend_status VARCHAR(20) NOT NULL, -- 'operational', 'degraded', 'outage', 'unknown'
    database_status VARCHAR(20) NOT NULL,
    latency_ms INT NOT NULL DEFAULT 0,
    error_message TEXT,
    raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_status_snapshots_timestamp ON status_snapshots(timestamp DESC);

-- 2. Structured Incidents & Maintenance
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'investigating', -- 'investigating', 'identified', 'monitoring', 'resolved'
    impact VARCHAR(20) NOT NULL DEFAULT 'minor', -- 'minor', 'major', 'critical'
    summary TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);

-- 3. Timeline updates for ongoing incidents
CREATE TABLE IF NOT EXISTS incident_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_updates_incident_id ON incident_updates(incident_id);

-- 4. Daily Uptime Aggregates (Rolling 90-day history)
CREATE TABLE IF NOT EXISTS daily_uptime_snapshots (
    date DATE PRIMARY KEY,
    uptime_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
    total_pings INT NOT NULL DEFAULT 0,
    successful_pings INT NOT NULL DEFAULT 0,
    avg_latency_ms INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
