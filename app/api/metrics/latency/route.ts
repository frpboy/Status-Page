import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const metrics = await queryNeon(
      `SELECT service_name, latency_ms, status_code, recorded_at
       FROM subsystem_latency_metrics
       ORDER BY recorded_at DESC
       LIMIT 100`
    );

    return NextResponse.json({ metrics, source: "neon_postgres" });
  } catch (err: any) {
    return NextResponse.json({ metrics: [], error: err?.message }, { status: 500 });
  }
}
