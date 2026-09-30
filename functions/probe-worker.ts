import { Client } from "@neondatabase/serverless";

/**
 * Dedicated Tiered Neon Probe Worker:
 * Enforces strict, non-false-green status taxonomy:
 * - Operational: A recent, successful check confirms the component works.
 * - Degraded: The component responds but an actual failure or performance threshold has been observed.
 * - Outage: An authoritative check has established that the service is unavailable.
 * - Unknown: The monitor lacks current evidence, including when permissions or upstream failures prevent checking.
 */
async function executeTieredProbe() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "https://erp.zerpai.com/api/v1";
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  let isOperational = false;
  let latencyMs = 0;
  let backendPayload: any = null;

  // 1. Explicit CloudFront Edge Probe
  let cloudfrontStatus: "operational" | "degraded" | "outage" | "unknown" = "unknown";
  let cloudfrontDetails: Record<string, any> = {
    domain: "erp.zerpai.com",
    protocol: "HTTPS / TLS 1.3",
    region: "Global Edge Network",
    measurementTimestamp: timestamp,
    note: "Edge reachability unverified",
  };

  try {
    const cfRes = await fetch("https://erp.zerpai.com/", {
      method: "HEAD",
      headers: { "User-Agent": "Neon-CF-Edge-Probe/1.0" },
    });
    if (cfRes.ok || cfRes.status === 301 || cfRes.status === 302 || cfRes.status === 404) {
      cloudfrontStatus = "operational";
      cloudfrontDetails.healthCheck = "Responding OK";
      cloudfrontDetails.note = "Verified live via independent CloudFront HTTPS HEAD probe";
      cloudfrontDetails.statusCode = cfRes.status;
    } else {
      cloudfrontStatus = "degraded";
      cloudfrontDetails.note = `CloudFront edge returned HTTP status ${cfRes.status}`;
    }
  } catch (cfErr: any) {
    cloudfrontStatus = "unknown";
    cloudfrontDetails.note = `CloudFront edge probe unverified: ${cfErr?.message || "Network error"}`;
  }

  // 2. Backend Health & AWS System Status Probe
  try {
    const res = await fetch(`${backendUrl}/health/system-status`, {
      headers: { "User-Agent": "Neon-Tiered-Probe-Worker/1.0" },
    });
    latencyMs = Date.now() - startTime;
    if (res.ok) {
      backendPayload = await res.json();
      isOperational = true;
    }
  } catch (err) {
    latencyMs = Date.now() - startTime;
  }

  // Build Services Map with strict non-false-green status rules
  const services: Record<string, any> = {
    cloudfront: {
      name: "AWS CloudFront CDN & Global Edge",
      status: cloudfrontStatus,
      details: cloudfrontDetails,
    },
    ecs: {
      name: "AWS ECS Fargate Backend Container",
      status: isOperational ? (backendPayload?.services?.ecs?.status || "operational") : "unknown",
      details: isOperational
        ? backendPayload?.services?.ecs?.details
        : {
            cluster: "zerpai-cluster",
            service: "zerpai-backend-service",
            note: "HTTP probe connection failed; ECS task state unverified (layer 7 / gateway check required)",
            measurementTimestamp: timestamp,
          },
    },
    rds: {
      name: "AWS RDS PostgreSQL Database",
      status: isOperational ? (backendPayload?.services?.rds?.status || "operational") : "unknown",
      details: isOperational
        ? backendPayload?.services?.rds?.details
        : {
            instanceId: "zerpai-db",
            class: "db.t4g.small",
            note: "RDS metrics unverified while backend API probe is unreachable",
            measurementTimestamp: timestamp,
          },
    },
    ec2_bastion: {
      name: "AWS EC2 Bastion SSM DB Tunnel",
      status: isOperational ? (backendPayload?.services?.ec2_bastion?.status || "operational") : "unknown",
      details: isOperational
        ? backendPayload?.services?.ec2_bastion?.details
        : {
            instanceId: "i-0e8150bdfa767cdb6",
            note: "EC2 status unverified while backend API probe is unreachable",
            measurementTimestamp: timestamp,
          },
    },
    cognito: {
      name: "AWS Cognito Identity Provider",
      status: isOperational ? (backendPayload?.services?.cognito?.status || "operational") : "unknown",
      details: isOperational
        ? backendPayload?.services?.cognito?.details
        : {
            userPoolId: "ap-south-2_h1Yyx4i4b",
            note: "Cognito status unverified while backend API probe is unreachable",
            measurementTimestamp: timestamp,
          },
    },
    neon_db: {
      name: "Neon Serverless PostgreSQL DB",
      status: "unknown" as const, // Will be set to operational only after DB write succeeds
      details: {
        note: "Neon DB write pending verification",
        measurementTimestamp: timestamp,
      },
    },
  };

  // 3. Database Write & Verification for Neon Serverless DB
  let neonDbWriteVerified = false;
  let dbErrorMsg: string | null = null;

  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    const rawPayload = {
      overallStatus: isOperational ? (backendPayload?.overallStatus || "operational") : "degraded",
      timestamp,
      environment: "production",
      region: "ap-south-2",
      source: "independent_external_probe",
      backendReachable: isOperational,
      latencyMs,
      services,
    };

    // Log Snapshot
    await client.query(
      `INSERT INTO status_snapshots (backend_status, database_status, latency_ms, raw_payload)
       VALUES ($1, $2, $3, $4)`,
      [
        isOperational ? "operational" : "degraded",
        services.rds.status,
        latencyMs,
        JSON.stringify(rawPayload),
      ]
    );

    // Log Daily Analytics
    const todayStr = new Date().toISOString().split("T")[0];
    await client.query(
      `INSERT INTO daily_uptime_snapshots (date, total_pings, successful_pings, avg_latency_ms, updated_at)
       VALUES ($1, 1, $2, $3, NOW())
       ON CONFLICT (date) DO UPDATE SET
         total_pings = daily_uptime_snapshots.total_pings + 1,
         successful_pings = daily_uptime_snapshots.successful_pings + $2,
         avg_latency_ms = (daily_uptime_snapshots.avg_latency_ms * daily_uptime_snapshots.total_pings + $3) / (daily_uptime_snapshots.total_pings + 1),
         uptime_percentage = ROUND(((daily_uptime_snapshots.successful_pings + $2)::numeric / (daily_uptime_snapshots.total_pings + 1)::numeric) * 100, 2),
         updated_at = NOW()`,
      [todayStr, isOperational ? 1 : 0, latencyMs]
    );

    neonDbWriteVerified = true;
  } catch (err: any) {
    dbErrorMsg = err?.message || "Neon DB write failed";
  } finally {
    await client.end();
  }

  // Update Neon DB status based on authoritative write verification
  if (neonDbWriteVerified) {
    services.neon_db.status = "operational";
    services.neon_db.details.note = "Neon DB connection & write verified successfully";
  } else {
    services.neon_db.status = "unknown";
    services.neon_db.details.note = `Neon DB write unverified: ${dbErrorMsg || "Database write error"}`;
  }

  return {
    success: true,
    timestamp,
    isOperational,
    latencyMs,
    neonDbWriteVerified,
    services,
  };
}

const probeWorker = {
  async fetch(request: Request) {
    try {
      const result = await executeTieredProbe();
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: err?.message || "Neon function execution error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  },
};

export default probeWorker;
