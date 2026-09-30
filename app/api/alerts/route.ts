import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    await ensureTablesExist();

    const alerts = await queryNeon(
      `SELECT id, alert_type, severity, metric_name, metric_value, threshold_value, details, created_at
       FROM telemetry_threshold_alerts
       ORDER BY created_at DESC
       LIMIT 30`
    );

    return NextResponse.json({ alerts, source: "neon_postgres" });
  } catch (err: any) {
    return NextResponse.json({ alerts: [], error: err?.message }, { status: 500 });
  }
}
