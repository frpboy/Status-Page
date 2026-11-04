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

test("next.config.js configures standard HTTP security headers", async () => {
  const nextConfigModule = await import("../next.config.js");
  const nextConfig = nextConfigModule.default || nextConfigModule;
  assert.ok(typeof nextConfig.headers === "function", "nextConfig.headers should be a function");
  const getHeaders = nextConfig.headers;
  const headersConfig = await getHeaders();
  const globalHeaderRule = headersConfig.find(
    (rule: { source: string; headers: Array<{ key: string; value: string }> }) => rule.source === "/:path*"
  );
  assert.ok(globalHeaderRule, "Should have a global header rule for /:path*");

  const headerMap = new Map(
    globalHeaderRule.headers.map((h: { key: string; value: string }) => [h.key.toLowerCase(), h.value])
  );
  assert.equal(headerMap.get("x-content-type-options"), "nosniff");
  assert.equal(headerMap.get("x-frame-options"), "SAMEORIGIN");
  assert.equal(headerMap.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.ok(headerMap.has("permissions-policy"));
});
