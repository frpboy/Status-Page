import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl =
    process.env.NEXT_PUBLIC_API_URL || "https://erp.zerpai.com/api/v1";
  const publicEdgeUrl = "https://erp.zerpai.com";
  const timestamp = new Date().toISOString();
  const startTime = Date.now();
  let isOperational = false;
  let latencyMs = 0;
  let payload: any = null;

  // 1. Probe NestJS Backend API
  try {
    const res = await fetch(`${backendUrl}/health/system-status`, {
      cache: "no-store",
      headers: { "User-Agent": "Vercel-Cron-Probe/1.0" },
    });
    latencyMs = Date.now() - startTime;

    if (res.ok) {
      payload = await res.json();
      isOperational = true;
    }
  } catch (err: any) {
    latencyMs = Date.now() - startTime;
  }

  // 2. Independent Public CloudFront Edge Probe
  let cloudfrontStatus = "unknown";
  let cloudfrontLatencyMs = 0;
  let cloudfrontHttpStatus = 0;

  try {
    const cfStartTime = Date.now();
    const cfRes = await fetch(publicEdgeUrl, {
      method: "HEAD",
      cache: "no-store",
      headers: { "User-Agent": "Vercel-Cron-Edge-Probe/1.0" },
    });
    cloudfrontLatencyMs = Date.now() - cfStartTime;
    cloudfrontHttpStatus = cfRes.status;

    if (cfRes.status < 400 && cloudfrontLatencyMs <= 2500) {
      cloudfrontStatus = "operational";
    } else if (cfRes.status >= 500) {
      cloudfrontStatus = "outage";
    } else {
      cloudfrontStatus = "degraded";
    }
  } catch (cfErr: any) {
    cloudfrontStatus = "unknown";
  }

  if (payload && payload.services) {
    payload.services.cloudfront = {
      name: "AWS CloudFront CDN & Global Edge",
      status: cloudfrontStatus,
      details: {
        domain: "erp.zerpai.com",
        independentProbe: true,
        httpStatus: cloudfrontHttpStatus,
        edgeLatencyMs: cloudfrontLatencyMs,
        measurementTimestamp: timestamp,
      },
    };
  }

  // Authoritative Persistence
  let neonLogged = false;
  let dbErrorMsg: string | null = null;

  try {
    await ensureTablesExist();

    await queryNeon(
      `INSERT INTO status_snapshots (backend_status, database_status, latency_ms, raw_payload)
       VALUES ($1, $2, $3, $4)`,
      [
        isOperational ? "operational" : "outage",
        payload?.services?.rds?.status || "unknown",
        latencyMs,
        payload ? JSON.stringify(payload) : null,
      ]
    );

    const todayStr = new Date().toISOString().split("T")[0];
    await queryNeon(
      `INSERT INTO daily_uptime_snapshots (date, total_pings, successful_pings, avg_latency_ms, updated_at)
       VALUES ($1, 1, $2, $3, NOW())
       ON CONFLICT (date) DO UPDATE SET
         total_pings = daily_uptime_snapshots.total_pings + 1,
         successful_pings = daily_uptime_snapshots.successful_pings + $2,
         avg_latency_ms = (daily_uptime_snapshots.avg_latency_ms * daily_uptime_snapshots.total_pings + $3) / (daily_uptime_snapshots.total_pings + 1),
         uptime_percentage = ROUND(((daily_uptime_snapshots.successful_pings + $2)::numeric / (daily_uptime_snapshots.total_pings + 1)::numeric) * 100, 2),
         updated_at = NOW()`,
      [todayStr, isOperational ? 1 : 0, latencyMs]
    );

    neonLogged = true;
  } catch (dbErr: any) {
    dbErrorMsg = dbErr?.message || "Neon DB persistence error";
    console.error("[Cron Probe] Neon DB persistence failure:", dbErr);
  }

  if (!neonLogged) {
    return NextResponse.json(
      {
        success: false,
        timestamp,
        isOperational,
        latencyMs,
        cloudfrontStatus,
        neonLogged: false,
        error: dbErrorMsg,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    timestamp,
    isOperational,
    latencyMs,
    cloudfrontStatus,
    neonLogged: true,
  });
}
