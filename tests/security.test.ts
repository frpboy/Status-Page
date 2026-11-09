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

test("security headers are configured and synchronized across Next.js and Vercel", async () => {
  const fs = await import("node:fs/promises");
  const path = await import("node:path");
  const { pathToFileURL } = await import("node:url");

  const nextConfigModule = await import(
    pathToFileURL(path.resolve(process.cwd(), "next.config.js")).href
  );
  const nextConfig = nextConfigModule.default || nextConfigModule;
  assert.equal(typeof nextConfig.headers, "function");

  const nextHeaders = await nextConfig.headers();
  const globalNextHeaderGroup = nextHeaders.find((h: any) => h.source === "/(.*)");
  assert.ok(globalNextHeaderGroup, "next.config.js should have a /(.*) headers rule");

  const vercelConfig = JSON.parse(
    await fs.readFile(path.resolve(process.cwd(), "vercel.json"), "utf-8")
  );
  const globalVercelHeaderGroup = vercelConfig.headers.find(
    (h: any) => h.source === "/(.*)"
  );
  assert.ok(globalVercelHeaderGroup, "vercel.json should have a /(.*) headers rule");

  const expectedHeaders: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  };

  for (const [key, value] of Object.entries(expectedHeaders)) {
    const nextItem = globalNextHeaderGroup.headers.find((h: any) => h.key === key);
    assert.equal(nextItem?.value, value, `next.config.js missing header ${key}`);

    const vercelItem = globalVercelHeaderGroup.headers.find((h: any) => h.key === key);
    assert.equal(vercelItem?.value, value, `vercel.json missing header ${key}`);
  }
});
