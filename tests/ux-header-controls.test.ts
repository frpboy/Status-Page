import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("header controls provide accessible ARIA attributes and keyboard focus styling", () => {
  const pagePath = path.resolve(process.cwd(), "app/page.tsx");
  const content = fs.readFileSync(pagePath, "utf-8");

  // Verify auto-refresh toggle accessibility
  assert.ok(
    content.includes('aria-label={`Toggle auto-refresh (currently ${autoRefresh ? "5 seconds" : "off"})`}'),
    "Auto-refresh button should have a dynamic aria-label indicating its current state"
  );
  assert.ok(
    content.includes("aria-pressed={autoRefresh}"),
    "Auto-refresh button should have an aria-pressed state"
  );

  // Verify manual refresh button accessibility
  assert.ok(
    content.includes('aria-label="Refresh telemetry data now"'),
    "Refresh button should have an informative aria-label"
  );
  assert.ok(
    content.includes("aria-busy={loading}"),
    "Refresh button should indicate busy state via aria-busy when fetching data"
  );

  // Verify App Portal external link accessibility
  assert.ok(
    content.includes('aria-label="Open ERP App Portal (opens in a new tab)"'),
    "External app portal link should have an explicit aria-label warning of new tab behavior"
  );

  // Verify keyboard navigation focus indicators
  assert.ok(
    content.includes("focus-visible:ring-2") && content.includes("focus-visible:ring-blue-500"),
    "Header interactive elements should include visible focus ring styles for keyboard navigation"
  );
});
