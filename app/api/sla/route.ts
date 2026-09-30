import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const sla = await queryNeon(
      `SELECT service_name, month_year, total_checks, successful_checks, sla_percentage, updated_at
       FROM subsystem_sla_monthly
       ORDER BY month_year DESC, service_name ASC`
    );

    return NextResponse.json({
      sla: sla || [],
      source: "neon_postgres",
    });
  } catch (err: any) {
    return NextResponse.json({ sla: [], error: err?.message }, { status: 500 });
  }
}
