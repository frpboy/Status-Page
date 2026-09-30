import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    await ensureTablesExist();

    // Query 90-day daily uptime history from Neon PostgreSQL
    const history = await queryNeon<Record<string, any>>(
      `SELECT date, total_pings, successful_pings, uptime_percentage, avg_latency_ms, updated_at
       FROM daily_uptime_snapshots
       ORDER BY date DESC
       LIMIT 90`
    );

    return NextResponse.json({ history, source: "neon_postgres" });
  } catch (err: any) {
    console.error("[History API] Error fetching daily uptime history:", err);
    return NextResponse.json(
      { history: [], error: err?.message || "Failed to fetch uptime history" },
      { status: 500 }
    );
  }
}
