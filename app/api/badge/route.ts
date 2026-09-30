import { NextResponse } from "next/server";
import { queryNeon } from "@/lib/db";
import { ensureTablesExist } from "@/lib/init-db";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export async function GET(request: Request) {
  let status = "unknown";
  let label = "unknown";
  let badgeColor = "#64748b"; // Slate Gray for unknown

  try {
    await ensureTablesExist();

    const snapshots = await queryNeon<Record<string, any>>(
      `SELECT backend_status, database_status, raw_payload, COALESCE(created_at, timestamp) AS snapshot_time
       FROM status_snapshots
       ORDER BY id DESC
       LIMIT 1`
    );

    if (snapshots && snapshots.length > 0) {
      const latest = snapshots[0];
      const snapshotTime = latest.snapshot_time || new Date().toISOString();
      const snapshotAgeMs = Date.now() - new Date(snapshotTime).getTime();

      let raw: any = {};
      if (latest.raw_payload) {
        raw =
          typeof latest.raw_payload === "string"
            ? JSON.parse(latest.raw_payload)
            : latest.raw_payload;
      }
      status = raw.overallStatus || latest.backend_status || "unknown";

      if (snapshotAgeMs > 300000 && status === "operational") {
        status = "stale";
      }
    }
  } catch (err) {
    status = "unknown";
  }

  const s = status.toLowerCase();
  if (s === "operational" || s === "healthy" || s === "ok") {
    label = "operational";
    badgeColor = "#10b981"; // Emerald Green
  } else if (s === "degraded" || s === "warning") {
    label = "degraded";
    badgeColor = "#f59e0b"; // Amber Yellow
  } else if (s === "stale") {
    label = "stale";
    badgeColor = "#f59e0b"; // Amber Yellow
  } else if (s === "outage" || s === "down") {
    label = "outage";
    badgeColor = "#ef4444"; // Rose Red
  } else {
    label = "unknown";
    badgeColor = "#64748b"; // Slate Gray
  }

  const labelText = "zerpai system";
  const statusText = label;

  const leftWidth = 95;
  const rightWidth = Math.max(75, statusText.length * 8 + 16);
  const totalWidth = leftWidth + rightWidth;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20" role="img" aria-label="${labelText}: ${statusText}">
  <title>${labelText}: ${statusText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="20" fill="#1e293b"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="20" fill="${badgeColor}"/>
    <rect width="${totalWidth}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text x="${(leftWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" textLength="${(leftWidth - 14) * 10}">${labelText}</text>
    <text x="${(leftWidth + rightWidth / 2) * 10}" y="140" transform="scale(.1)" fill="#fff" font-weight="bold" textLength="${(rightWidth - 14) * 10}">${statusText}</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
