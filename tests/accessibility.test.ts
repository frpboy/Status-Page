import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs";
import path from "node:path";

test("historical uptime bars include keyboard navigation and ARIA attributes", () => {
  const pageSource = fs.readFileSync(path.resolve(process.cwd(), "app/page.tsx"), "utf-8");

  // Ensure bars have tabIndex, role="button", and aria-label
  assert.ok(
    pageSource.includes('role="button"'),
    "Expected uptime bars to have role='button' for accessibility"
  );
  assert.ok(
    pageSource.includes("tabIndex={0}"),
    "Expected uptime bars to have tabIndex={0} for keyboard navigation"
  );
  assert.ok(
    pageSource.includes("aria-label={noDataLabel}"),
    "Expected no-data uptime bars to provide aria-label"
  );
  assert.ok(
    pageSource.includes("aria-label={uptimeLabel}"),
    "Expected uptime bars with data to provide descriptive aria-label"
  );
  assert.ok(
    pageSource.includes("focus-visible:ring-2 focus-visible:ring-blue-400"),
    "Expected uptime bars and buttons to have visible focus rings"
  );
});

test("header controls have accessible states and roles", () => {
  const pageSource = fs.readFileSync(path.resolve(process.cwd(), "app/page.tsx"), "utf-8");

  // Auto-refresh toggle switch
  assert.ok(
    pageSource.includes('role="switch"'),
    "Expected auto-refresh toggle to have role='switch'"
  );
  assert.ok(
    pageSource.includes("aria-checked={autoRefresh}"),
    "Expected auto-refresh toggle to announce state via aria-checked"
  );

  // Refresh Now button busy state
  assert.ok(
    pageSource.includes("aria-busy={loading}"),
    "Expected refresh button to communicate busy state via aria-busy"
  );
});
