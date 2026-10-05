import assert from "node:assert/strict";
import test from "node:test";
import probeWorker from "@/functions/probe-worker";

for (const scenario of [
  { name: "HTTP 200 with degraded health", backend: "degraded", edge: 200, overall: "degraded" },
  { name: "edge HTTP 503 with reachable backend", backend: "operational", edge: 503, overall: "outage" },
]) test(`${scenario.name} is not a successful health check; absent components stay unknown`, async (t) => {
  const previousUrl = process.env.DATABASE_URL;
  process.env.DATABASE_URL = "postgresql://test:test@unit-test.neon.tech/neondb";
  t.after(() => { if (previousUrl === undefined) delete process.env.DATABASE_URL; else process.env.DATABASE_URL = previousUrl; });
  let transaction: any;
  t.mock.method(globalThis, "fetch", async (url: string, options: RequestInit) => {
    if (options.method === "POST") {
      const body = JSON.parse(options.body as string);
      if (body.queries) transaction = body;
      const result = { fields: [], rows: [], rowCount: 1, command: "INSERT" };
      return Response.json(body.queries ? { results: body.queries.map(() => result) } : result);
    }
    if (options.method === "HEAD") return new Response(null, { status: scenario.edge });
    return Response.json({ overallStatus: scenario.backend, services: {} });
  });
  const response = await probeWorker.fetch(new Request("http://localhost/probe"));
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.success, true);
  assert.equal(result.services.rds.status, "unknown");
  const persisted = JSON.parse(transaction.queries[0].params[3]);
  assert.equal(persisted.services.neon_db.status, "operational");
  assert.equal(persisted.overallStatus, scenario.overall);
  assert.equal(Number(transaction.queries[1].params[1]), 0);
});
