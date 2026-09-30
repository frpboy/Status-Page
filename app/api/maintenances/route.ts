import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import {
  getRequestClientKey,
  parseMaintenancePayload,
  PayloadValidationError,
  verifyRequiredSecret,
  writeRateLimiter,
} from "@/lib/api-security";

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

export async function POST(request: Request) {
  const rateLimit = writeRateLimiter.check(`maintenance:${getRequestClientKey(request)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }
  if (!verifyRequiredSecret(process.env.STATUS_ADMIN_KEY, request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { title, serviceName, description, scheduledStart, scheduledEnd } = parseMaintenancePayload(await request.json());

    const inserted = await queryNeon(
      `INSERT INTO scheduled_maintenances (title, service_name, description, scheduled_start, scheduled_end)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        title,
        serviceName,
        description,
        scheduledStart,
        scheduledEnd,
      ]
    );

    return NextResponse.json({ success: true, maintenance: inserted[0] }, { status: 201 });
  } catch (err) {
    if (err instanceof PayloadValidationError || err instanceof SyntaxError) {
      return NextResponse.json({ error: err instanceof Error ? err.message : "Invalid request body." }, { status: 400 });
    }
    console.error("[Maintenances API] Failed to create maintenance:", err);
    return NextResponse.json({ error: "Unable to create the maintenance." }, { status: 500 });
  }
}
