import { queryNeon } from "./db";

let isInitialized = false;

export async function ensureTablesExist() {
  if (isInitialized) return;

  try {
    // 1. Raw Telemetry & Status Snapshots Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS status_snapshots (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          backend_status VARCHAR(20) NOT NULL,
          database_status VARCHAR(20) NOT NULL,
          latency_ms INT NOT NULL DEFAULT 0,
          error_message TEXT,
          raw_payload JSONB
      )
    `);

    await queryNeon(`
      ALTER TABLE status_snapshots ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `);

    // 2. Active & Historical Incidents Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS incidents (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL DEFAULT 'investigating',
          impact VARCHAR(20) NOT NULL DEFAULT 'minor',
          summary TEXT,
          started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          resolved_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 3. Incident Progress Updates Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS incident_updates (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
          message TEXT NOT NULL,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 4. Daily Uptime Aggregates Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS daily_uptime_snapshots (
          date DATE PRIMARY KEY,
          uptime_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
          total_pings INT NOT NULL DEFAULT 0,
          successful_pings INT NOT NULL DEFAULT 0,
          avg_latency_ms INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 5. NEW: Subsystem Latency Metrics Breakdown Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS subsystem_latency_metrics (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(100) NOT NULL,
          latency_ms INT NOT NULL DEFAULT 0,
          status_code INT NOT NULL DEFAULT 200,
          recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 6. NEW: Resource Exhaustion & Threshold Warning Alert Log Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS telemetry_threshold_alerts (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          alert_type VARCHAR(50) NOT NULL,
          severity VARCHAR(20) NOT NULL DEFAULT 'warning',
          metric_name VARCHAR(100) NOT NULL,
          metric_value NUMERIC(10, 2) NOT NULL,
          threshold_value NUMERIC(10, 2) NOT NULL,
          details TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 7. NEW: Scheduled Maintenance Announcements Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS scheduled_maintenances (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          service_name VARCHAR(100) NOT NULL DEFAULT 'All Services',
          status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
          description TEXT,
          scheduled_start TIMESTAMPTZ NOT NULL,
          scheduled_end TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // 8. NEW: Subsystem Monthly SLA Aggregate Table
    await queryNeon(`
      CREATE TABLE IF NOT EXISTS subsystem_sla_monthly (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          service_name VARCHAR(100) NOT NULL,
          month_year VARCHAR(7) NOT NULL,
          total_checks INT NOT NULL DEFAULT 0,
          successful_checks INT NOT NULL DEFAULT 0,
          sla_percentage NUMERIC(5, 2) NOT NULL DEFAULT 100.00,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(service_name, month_year)
      )
    `);

    isInitialized = true;
  } catch (err) {
    console.error("[Init DB] Failed to auto-provision Neon tables:", err);
  }
}
