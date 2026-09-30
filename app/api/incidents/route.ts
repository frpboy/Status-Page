import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import {
  getRequestClientKey,
  parseIncidentPayload,
  PayloadValidationError,
  verifyRequiredSecret,
  writeRateLimiter,
} from "@/lib/api-security";

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
    return NextResponse.json({ incidents: [], error: err?.message });
  }
}

export async function POST(request: Request) {
  const rateLimit = writeRateLimiter.check(`incident:${getRequestClientKey(request)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }
  if (!verifyRequiredSecret(process.env.STATUS_ADMIN_KEY, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { title, status, impact, summary, message } = parseIncidentPayload(await request.json());

    // Insert incident into Neon PostgreSQL
    const inserted = await queryNeon(
      `INSERT INTO incidents (title, status, impact, summary, started_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [title, status, impact || "minor", summary || null]
    );

    const incident = inserted[0];

    if (incident && message) {
      await queryNeon(
        `INSERT INTO incident_updates (incident_id, message, status)
         VALUES ($1, $2, $3)`,
        [incident.id, message, status]
      );
    }

    return NextResponse.json({ success: true, incident }, { status: 201 });
  } catch (err) {
    if (err instanceof PayloadValidationError || err instanceof SyntaxError) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request body." }, { status: 400 });
    }
    console.error("[Incidents API] Failed to create incident:", err);
    return NextResponse.json({ error: "Unable to create the incident." }, { status: 500 });
  }
}
