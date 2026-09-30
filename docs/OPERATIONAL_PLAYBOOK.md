# Operational Runbook & Playbook
## Zerpai Status Page Telemetry & Incident Management

---

## 1. Background Telemetry Worker Integration

The status page reads authoritative telemetry snapshots from Neon PostgreSQL table `status_snapshots`.

### Telemetry Worker Payload Protocol
The background probe emits a POST or direct Neon DB SQL `INSERT` every 1 to 5 minutes:

```sql
INSERT INTO status_snapshots (
    backend_status,
    database_status,
    latency_ms,
    raw_payload
) VALUES (
    'operational',
    'operational',
    103,
    '{
      "overallStatus": "operational",
      "timestamp": "2026-09-30T10:45:00.000Z",
      "services": {
        "ecs": { "name": "AWS ECS Fargate Backend Container", "status": "operational", "details": {"cluster": "zerpai-cluster", "runningTasks": 1} },
        "rds": { "name": "AWS RDS PostgreSQL Database", "status": "operational", "details": {"class": "db.t4g.small", "latencyMs": 9, "freeableMemoryMB": "653.95 MB", "cpuUtilizationPct": "3.7%"} },
        "redis": { "name": "Upstash Redis Cache Engine", "status": "operational", "details": {"reachable": true} },
        "cognito": { "name": "AWS Cognito Authentication Provider", "status": "operational", "details": {"userPoolId": "ap-south-2_h1Yyx4i4b"} },
        "cloudfront": { "name": "AWS CloudFront CDN & Global Edge", "status": "operational", "details": {"domain": "erp.zerpai.com"} },
        "ec2_bastion": { "name": "AWS EC2 Bastion SSM DB Tunnel", "status": "operational", "details": {"instanceId": "i-0e8150bdfa767cdb6", "tunnelPort": 5433} }
      }
    }'::jsonb
);
```

---

## 2. Posting Manual Incident Reports

When an active incident occurs, insert a record into `incidents`:

```sql
INSERT INTO incidents (title, status, impact, summary, started_at)
VALUES (
    'AWS ap-south-2 Latency Spike',
    'investigating',
    'minor',
    'Investigating elevated database roundtrip query latency in ap-south-2 availability zone.',
    NOW()
);
```

To resolve the incident:

```sql
UPDATE incidents
SET status = 'resolved', resolved_at = NOW()
WHERE id = '<INCIDENT_UUID>';
```
