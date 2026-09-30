import assert from "node:assert/strict";
import test from "node:test";

import {
  LATEST_SNAPSHOT_ORDER,
  getDisplayedOverallStatus,
  getServiceStatus,
} from "@/lib/status-truth";

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
