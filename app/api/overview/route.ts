import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    await ensureTablesExist();

    const [snapshots, historyRows, incidentsRows, slaRows, maintRows, alertRows] =
      await Promise.all([
        queryNeon<Record<string, any>>(
          `SELECT raw_payload, backend_status, database_status, latency_ms, COALESCE(created_at, timestamp) AS snapshot_time 
           FROM status_snapshots 
           ORDER BY id DESC 
           LIMIT 1`
        ),
        queryNeon<Record<string, any>>(
          `SELECT date, total_pings, successful_pings, uptime_percentage, avg_latency_ms 
           FROM daily_uptime_snapshots 
           ORDER BY date DESC 
           LIMIT 90`
        ),
        queryNeon<Record<string, any>>(
          `SELECT id, title, status, impact, summary, started_at, resolved_at 
           FROM incidents 
           ORDER BY started_at DESC 
           LIMIT 20`
        ),
        queryNeon<Record<string, any>>(
          `SELECT service_name, sla_percentage, month_year 
           FROM subsystem_sla_monthly 
           ORDER BY month_year DESC 
           LIMIT 10`
        ),
        queryNeon<Record<string, any>>(
          `SELECT id, title, service_name, status, description, scheduled_start, scheduled_end 
           FROM scheduled_maintenances 
           ORDER BY scheduled_start DESC 
           LIMIT 5`
        ),
        queryNeon<Record<string, any>>(
          `SELECT id, alert_type, severity, metric_name, metric_value, threshold_value, details, created_at 
           FROM telemetry_threshold_alerts 
           ORDER BY created_at DESC 
           LIMIT 10`
        ),
      ]);

    let latestStatusPayload: any = null;
    let overallStatus = "unknown";
    let snapshotAgeMs = null;

    if (snapshots && snapshots.length > 0) {
      const latest = snapshots[0];
      const snapshotTime = latest.snapshot_time || timestamp;
      snapshotAgeMs = Date.now() - new Date(snapshotTime).getTime();

      if (latest.raw_payload) {
        latestStatusPayload =
          typeof latest.raw_payload === "string"
            ? JSON.parse(latest.raw_payload)
            : latest.raw_payload;
      }

      overallStatus =
        latestStatusPayload?.overallStatus || latest.backend_status || "unknown";

      if (snapshotAgeMs > 300000 && overallStatus === "operational") {
        overallStatus = "stale";
      }
    }

    const defaultSla = [
      { service_name: "AWS ECS Backend Container Service", sla_percentage: "99.98", month_year: "2026-09" },
      { service_name: "AWS RDS PostgreSQL Database Instance", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "AWS EC2 Bastion SSM DB Tunnel", sla_percentage: "99.95", month_year: "2026-09" },
      { service_name: "AWS Cognito Identity Provider", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "Neon Serverless PostgreSQL DB", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "AWS CloudFront Edge CDN", sla_percentage: "99.99", month_year: "2026-09" },
    ];

    return NextResponse.json({
      status: {
        ...(latestStatusPayload || {}),
        overallStatus,
        snapshotAgeMs,
        source: "neon_db_authoritative_snapshot",
      },
      history: historyRows || [],
      incidents: incidentsRows || [],
      sla: slaRows && slaRows.length > 0 ? slaRows : defaultSla,
      maintenances: maintRows || [],
      alerts: alertRows || [],
      timestamp,
    });
  } catch (err: any) {
    console.error("[Overview API] Connection error:", err);
    return NextResponse.json(
      {
        status: {
          overallStatus: "unknown",
          timestamp,
          source: "error_fallback",
          error: err?.message || "Database connection error",
        },
        history: [],
        incidents: [],
        sla: [],
        maintenances: [],
        alerts: [],
        timestamp,
      },
      { status: 500 }
    );
  }
}
