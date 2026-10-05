import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const maintenances = await queryNeon(
      `SELECT id, title, service_name, status, description, scheduled_start, scheduled_end, created_at
       FROM scheduled_maintenances
       WHERE scheduled_end >= NOW() - INTERVAL '7 days'
       ORDER BY scheduled_start ASC`
    );

    return NextResponse.json({ maintenances, source: "neon_postgres" });
  } catch (err: any) {
    return NextResponse.json({ maintenances: [], error: err?.message }, { status: 500 });
  }
}
