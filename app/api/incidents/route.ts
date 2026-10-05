import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET() {
  // Read active incidents & recent updates from Neon PostgreSQL
  try {
    const incidents = await queryNeon(`
      SELECT i.*, 
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', u.id,
                   'message', u.message,
                   'status', u.status,
                   'created_at', u.created_at
                 ) ORDER BY u.created_at DESC
               ) FILTER (WHERE u.id IS NOT NULL), '[]'
             ) AS updates
      FROM incidents i
      LEFT JOIN incident_updates u ON i.id = u.incident_id
      GROUP BY i.id
      ORDER BY i.created_at DESC
      LIMIT 20
    `);

    return NextResponse.json({ incidents, source: "neon_postgres" });
  } catch (err: any) {
    console.error("[Incidents API] Unable to read incidents:", err);
    return NextResponse.json({ incidents: [], error: "Incident data is temporarily unavailable." }, { status: 500 });
  }
}
