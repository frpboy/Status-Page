const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd());
const { executeTieredProbe } = require("../functions/probe-worker.ts");

const intervalMs = 60_000;

async function run() {
  do {
    const started = Date.now();
    try {
      const result = await executeTieredProbe();
      if (!result.success) throw new Error("Telemetry persistence failed");
      console.log(`[${result.timestamp}] Snapshot committed | Backend reachable: ${result.isOperational} | Latency: ${result.latencyMs}ms`);
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Probe failed: ${err.message}`);
      if (process.argv.includes("--once")) process.exitCode = 1;
    }
    if (process.argv.includes("--once")) return;
    // One in-flight probe; a slow upstream never creates overlapping writes.
    await new Promise((resolve) => setTimeout(resolve, Math.max(1000, intervalMs - (Date.now() - started))));
  } while (true);
}

run().catch((err) => { console.error(err.message); process.exitCode = 1; });
