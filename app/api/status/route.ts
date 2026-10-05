import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { getDisplayedOverallStatus, getDisplayedServices, LATEST_SNAPSHOT_ORDER } from "@/lib/status-truth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/status
 * Read-Only Telemetry Consumer Architecture:
 * Page visitors are 100% read-only consumers. Snapshot observations are written exclusively by the background cron probe worker (/api/cron/probe).
 * Status Truth Model:
 * Unknown must never become healthy.
 * States: operational | degraded | outage | unknown | stale
 */
export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    const snapshots = await queryNeon<Record<string, any>>(
      `SELECT raw_payload, backend_status, database_status, latency_ms, COALESCE(created_at, timestamp) AS snapshot_time 
       FROM status_snapshots 
       ORDER BY ${LATEST_SNAPSHOT_ORDER}
       LIMIT 1`
    );

    if (snapshots && snapshots.length > 0) {
      const latest = snapshots[0];
      const snapshotTime = latest.snapshot_time || timestamp;
      const snapshotAgeMs = Date.now() - new Date(snapshotTime).getTime();

      let payload: any = {};
      if (latest.raw_payload) {
        payload =
          typeof latest.raw_payload === "string"
            ? JSON.parse(latest.raw_payload)
            : latest.raw_payload;
      }

      const overallStatus = getDisplayedOverallStatus(
        payload?.overallStatus || latest.backend_status,
        snapshotAgeMs
      );

      return NextResponse.json({
        ...payload,
        services: getDisplayedServices(payload.services, snapshotAgeMs),
        overallStatus,
        source: "neon_db_authoritative_snapshot",
        snapshotAgeMs,
        snapshotCreatedAt: snapshotTime,
      });
    }

    return NextResponse.json({
      overallStatus: "unknown",
      timestamp,
      source: "neon_db_pending",
      message: "Initial telemetry snapshot pending probe worker observation.",
      services: {},
    });
  } catch (dbErr: any) {
    console.error("[Status API] DB error:", dbErr);
    return NextResponse.json(
      {
        overallStatus: "unknown",
        timestamp,
        source: "neon_db_error",
        error: "Status data is temporarily unavailable.",
        services: {},
      },
      { status: 500 }
    );
  }
}
