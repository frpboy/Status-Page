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
