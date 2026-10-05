import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { getDisplayedOverallStatus, getDisplayedServices, LATEST_SNAPSHOT_ORDER } from "@/lib/status-truth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const [snapshots, historyRows, incidentsRows, slaRows, maintRows, alertRows] =
      await Promise.all([
        queryNeon<Record<string, any>>(
          `SELECT raw_payload, backend_status, database_status, latency_ms, COALESCE(created_at, timestamp) AS snapshot_time 
           FROM status_snapshots 
           ORDER BY ${LATEST_SNAPSHOT_ORDER}
           LIMIT 1`
        ),
        queryNeon<Record<string, any>>(
          `SELECT date::text AS date, total_pings, successful_pings, uptime_percentage, avg_latency_ms
           FROM daily_uptime_snapshots 
           WHERE date >= CURRENT_DATE - 89
           ORDER BY date DESC 
           LIMIT 90`
        ),
        queryNeon<Record<string, any>>(
          `SELECT i.id, i.title, i.status, i.impact, i.summary, i.started_at, i.resolved_at,
             COALESCE((SELECT json_agg(u ORDER BY u.created_at DESC)
               FROM incident_updates u WHERE u.incident_id = i.id), '[]'::json) AS updates
           FROM incidents i
           WHERE i.started_at >= NOW() - INTERVAL '90 days' OR i.resolved_at IS NULL
           ORDER BY i.started_at DESC
           LIMIT 20`
        ),
        queryNeon<Record<string, any>>(
          `SELECT service_name, sla_percentage, month_year, total_checks, successful_checks
           FROM subsystem_sla_monthly 
           WHERE month_year = TO_CHAR(NOW() AT TIME ZONE 'UTC', 'YYYY-MM')
           ORDER BY service_name ASC
           LIMIT 10`
        ),
        queryNeon<Record<string, any>>(
          `SELECT id, title, service_name, status, description, scheduled_start, scheduled_end 
           FROM scheduled_maintenances 
           WHERE scheduled_end >= NOW() AND status IN ('scheduled', 'in_progress')
           ORDER BY scheduled_start ASC
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
    let snapshotCreatedAt = null;

    if (snapshots && snapshots.length > 0) {
      const latest = snapshots[0];
      const snapshotTime = latest.snapshot_time || timestamp;
      snapshotCreatedAt = snapshotTime;
      snapshotAgeMs = Date.now() - new Date(snapshotTime).getTime();

      if (latest.raw_payload) {
        latestStatusPayload =
          typeof latest.raw_payload === "string"
            ? JSON.parse(latest.raw_payload)
            : latest.raw_payload;
      }

      overallStatus =
        latestStatusPayload?.overallStatus || latest.backend_status || "unknown";

      overallStatus = getDisplayedOverallStatus(overallStatus, snapshotAgeMs);
    }

    return NextResponse.json({
      status: {
        ...(latestStatusPayload || {}),
        services: getDisplayedServices(latestStatusPayload?.services, snapshotAgeMs ?? NaN),
        snapshotCreatedAt,
        overallStatus,
        snapshotAgeMs,
        source: "neon_db_authoritative_snapshot",
      },
      history: historyRows || [],
      incidents: incidentsRows || [],
      sla: slaRows || [],
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
          error: "Status data is temporarily unavailable.",
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
