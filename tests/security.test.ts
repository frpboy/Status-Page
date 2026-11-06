import assert from "node:assert/strict";
import test from "node:test";

import {
  createRateLimiter,
  parseIncidentPayload,
  parseMaintenancePayload,
  verifyRequiredSecret,
} from "@/lib/api-security";

test("rejects a missing server-side secret", () => {
  assert.equal(verifyRequiredSecret(undefined, "Bearer any-value"), false);
});

test("accepts only the matching bearer secret", () => {
  assert.equal(verifyRequiredSecret("expected", "Bearer expected"), true);
  assert.equal(verifyRequiredSecret("expected", "Bearer incorrect"), false);
});

test("rejects incident statuses outside the published taxonomy", () => {
  assert.throws(
    () => parseIncidentPayload({ title: "Database issue", status: "green" }),
    /status/
  );
});

test("rejects unexpected incident fields instead of silently accepting them", () => {
  assert.throws(
    () => parseIncidentPayload({ title: "Database issue", status: "investigating", publishNow: true }),
    /unexpected/
  );
});

test("rejects maintenance windows that end before they start", () => {
  assert.throws(
    () =>
      parseMaintenancePayload({
        title: "Database maintenance",
        scheduled_start: "2026-10-01T12:00:00.000Z",
        scheduled_end: "2026-10-01T11:00:00.000Z",
      }),
    /after/
  );
});

test("rate limiter rejects requests after its fixed window limit", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
  assert.equal(limiter.check("operator", 0).allowed, true);
  assert.equal(limiter.check("operator", 1).allowed, true);
  assert.equal(limiter.check("operator", 2).allowed, false);
});

test("enforces security headers in next.config.js and vercel.json", async () => {
  const imported = (await import("../next.config.js")) as unknown as { default: { headers?: () => Promise<Array<{ source: string; headers: Array<{ key: string; value: string }> }>> } };
  const nextConfig = imported.default;
  assert.ok(typeof nextConfig.headers === "function", "nextConfig must define headers()");
  const headersConfig = await nextConfig.headers();
  const globalRoute = headersConfig.find((h) => h.source === "/:path*");
  assert.ok(globalRoute, "next.config.js must contain a global headers rule for /:path*");

  const requiredHeaders = [
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Strict-Transport-Security",
    "Permissions-Policy",
  ];

  for (const headerName of requiredHeaders) {
    const header = globalRoute.headers.find((h) => h.key === headerName);
    assert.ok(header, `next.config.js is missing security header: ${headerName}`);
    assert.ok(header.value.length > 0, `Header value for ${headerName} should not be empty`);
  }

  const { readFileSync } = await import("node:fs");
  const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf-8"));
  const vercelGlobal = vercelConfig.headers.find((h: { source: string }) => h.source === "/(.*)");
  assert.ok(vercelGlobal, "vercel.json must contain a global headers rule for /(.*)");

  for (const headerName of requiredHeaders) {
    const header = vercelGlobal.headers.find((h: { key: string; value: string }) => h.key === headerName);
    assert.ok(header, `vercel.json is missing security header: ${headerName}`);
    assert.ok(header.value.length > 0, `Header value for ${headerName} in vercel.json should not be empty`);
  }
});
