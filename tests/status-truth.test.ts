import assert from "node:assert/strict";
import test from "node:test";

import {
  LATEST_SNAPSHOT_ORDER,
  getDisplayedOverallStatus,
  getServiceStatus,
  getDisplayedServices,
} from "@/lib/status-truth";
import { calculateMonthlySla } from "@/lib/sla-aggregation";

test("latest snapshots are ordered by observation timestamp, never random UUID", () => {
  assert.equal(LATEST_SNAPSHOT_ORDER, "created_at DESC, id DESC");
});

test("stale telemetry cannot be displayed as operational", () => {
  assert.equal(getDisplayedOverallStatus("operational", 300_001), "stale");
});

test("missing service evidence remains unknown", () => {
  assert.equal(getServiceStatus(undefined), "unknown");
});

test("unknown is preserved rather than promoted to operational", () => {
  assert.equal(getDisplayedOverallStatus("unknown", 0), "unknown");
});

test("monthly SLA counts only authoritative checks and never treats unknown as healthy", () => {
  assert.deepEqual(
    calculateMonthlySla(["operational", "degraded", "unknown", "outage"]),
    { totalChecks: 3, successfulChecks: 1, percentage: "33.33" }
  );
});

test("monthly SLA remains absent when there is no authoritative evidence", () => {
  assert.equal(calculateMonthlySla(["unknown", "stale"]), null);
});

test("expired component evidence cannot retain green badges", () => {
  const services = { ecs: { status: "operational", details: {} }, rds: { status: "unknown" } };
  assert.equal(getDisplayedServices(services, 300_001).ecs.status, "stale");
  assert.equal(getDisplayedServices(services, 300_001).rds.status, "unknown");
  assert.equal(services.ecs.status, "operational");
});

test("invalid and future observation times cannot establish health", () => {
  assert.equal(getDisplayedOverallStatus("operational", NaN), "unknown");
  assert.equal(getDisplayedOverallStatus("operational", -60_000), "unknown");
});
