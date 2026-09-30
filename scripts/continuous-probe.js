const http = require("http");
const https = require("https");

const PROBE_URL = process.env.PROBE_URL || "https://br-dark-truth-b3jx2nzt-statusprobe.compute.c-4.ap-southeast-1.aws.neon.tech/";
// Tiered Dedicated Availability Interval: 30 Seconds
const FAST_AVAILABILITY_INTERVAL_MS = 30000;

console.log(`========================================================`);
console.log(` STARTED 30-SECOND DEDICATED TELEMETRY PROBE DAEMON`);
console.log(` Target Probe URL: ${PROBE_URL}`);
console.log(` Interval: ${FAST_AVAILABILITY_INTERVAL_MS} ms (Every 30 seconds)`);
console.log(`========================================================\n`);

let totalPings = 0;
let successPings = 0;
let totalLatency = 0;

function sendProbe() {
  totalPings++;
  const startTime = Date.now();
  const reqModule = PROBE_URL.startsWith("https") ? https : http;

  const req = reqModule.get(PROBE_URL, (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => {
      const latencyMs = Date.now() - startTime;
      if (res.statusCode >= 200 && res.statusCode < 300) {
        successPings++;
        totalLatency += latencyMs;
        const avgLatency = Math.round(totalLatency / successPings);
        const uptimePct = ((successPings / totalPings) * 100).toFixed(1);
        console.log(
          `[${new Date().toISOString()}] 30s Availability Ping #${totalPings} SUCCESS | Status: ${res.statusCode} | Latency: ${latencyMs}ms | Avg: ${avgLatency}ms | Uptime: ${uptimePct}%`
        );
      } else {
        console.warn(
          `[${new Date().toISOString()}] 30s Availability Ping #${totalPings} WARNING | Status: ${res.statusCode} | Latency: ${latencyMs}ms`
        );
      }
    });
  });

  req.on("error", (err) => {
    const latencyMs = Date.now() - startTime;
    console.error(
      `[${new Date().toISOString()}] 30s Availability Ping #${totalPings} FAILED | Error: ${err.message} | Latency: ${latencyMs}ms`
    );
  });

  req.end();
}

// Execute initial probe immediately, then run dedicated 30-second interval
sendProbe();
setInterval(sendProbe, FAST_AVAILABILITY_INTERVAL_MS);
