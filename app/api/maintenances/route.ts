import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    await ensureTablesExist();

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

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, service_name, description, scheduled_start, scheduled_end } = body;

    if (!title || !scheduled_start || !scheduled_end) {
      return NextResponse.json(
        { error: "title, scheduled_start, and scheduled_end are required" },
        { status: 400 }
      );
    }

    await ensureTablesExist();

    const inserted = await queryNeon(
      `INSERT INTO scheduled_maintenances (title, service_name, description, scheduled_start, scheduled_end)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        service_name || "All Services",
        description || null,
        scheduled_start,
        scheduled_end,
      ]
    );

    return NextResponse.json({ success: true, maintenance: inserted[0] }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message }, { status: 500 });
  }
}
