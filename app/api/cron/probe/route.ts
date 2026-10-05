import { NextResponse } from "next/server";
import { executeTieredProbe } from "@/functions/probe-worker";
import { getRequestClientKey, writeRateLimiter } from "@/lib/api-security";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const rateLimit = writeRateLimiter.check(`cron:${getRequestClientKey(request)}`);
  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } });
  }


  try {
    const result = await executeTieredProbe();
    return NextResponse.json(result, { status: result.success ? 200 : 500 });
  } catch (err) {
    console.error("[Cron Probe] Probe failed:", err);
    return NextResponse.json({ success: false, error: "Telemetry probe failed." }, { status: 500 });
  }
}
