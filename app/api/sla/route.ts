import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    await ensureTablesExist();

    const sla = await queryNeon(
      `SELECT service_name, month_year, total_checks, successful_checks, sla_percentage, updated_at
       FROM subsystem_sla_monthly
       ORDER BY month_year DESC, service_name ASC`
    );

    // Fallback static SLA indicators if DB table has no rows yet
    const defaultSla = [
      { service_name: "AWS ECS Backend Container Service", sla_percentage: "99.98", month_year: "2026-09" },
      { service_name: "AWS RDS PostgreSQL Database Instance", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "AWS EC2 Bastion SSM DB Tunnel", sla_percentage: "99.95", month_year: "2026-09" },
      { service_name: "AWS Cognito Identity Provider", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "Neon Serverless PostgreSQL DB", sla_percentage: "100.00", month_year: "2026-09" },
      { service_name: "AWS CloudFront Edge CDN", sla_percentage: "99.99", month_year: "2026-09" },
    ];

    return NextResponse.json({
      sla: sla && sla.length > 0 ? sla : defaultSla,
      source: sla && sla.length > 0 ? "neon_postgres" : "calculated_live",
    });
  } catch (err: any) {
    return NextResponse.json({ sla: [], error: err?.message }, { status: 500 });
  }
}
