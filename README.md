# Zerpai Infrastructure System Status Page & Telemetry Engine

A standalone, high-reliability **Next.js 14** system status dashboard and continuous telemetry engine deployed to **Vercel Edge Network** with **Neon Serverless PostgreSQL** analytics.

## 1. Architecture & Specification Documentation Index

Comprehensive project documentation is available under `docs/`:

| Document | Description |
| --- | --- |
| [PRD.md](file:///E:/zerpai-new/status-page/docs/PRD.md) | **Product Requirements Document**: Vision, user personas, core features, and success metrics. |
| [TRD.md](file:///E:/zerpai-new/status-page/docs/TRD.md) | **Technical Requirements Document**: System interactions, API contracts, sequence flows, and fallback logic. |
| [ERD.md](file:///E:/zerpai-new/status-page/docs/ERD.md) | **Entity Relationship Diagram & Schema**: 8 Neon PostgreSQL table definitions, columns, and constraints. |
| [FRD.md](file:///E:/zerpai-new/status-page/docs/FRD.md) | **Functional Requirements Document**: Functional requirements matrix (FR-01 to FR-10) and evaluation logic. |
| [TECH_STACK.md](file:///E:/zerpai-new/status-page/docs/TECH_STACK.md) | **Technology Stack**: Next.js 14 App Router, Vercel Edge Network, Neon Serverless, and AWS integrations. |
| [UI_UX_SPECIFICATION.md](file:///E:/zerpai-new/status-page/docs/UI_UX_SPECIFICATION.md) | **UI/UX Design System**: Color tokens, typography, glassmorphism, micro-animations, and layout grid. |
| [OPERATIONAL_PLAYBOOK.md](file:///E:/zerpai-new/status-page/docs/OPERATIONAL_PLAYBOOK.md) | **Operational Runbook**: Telemetry worker payload protocol, incident management SQL, and maintenance runbook. |

---

## 2. Open Public Internal Access Policy

All status dashboard pages, APIs, and management endpoints are **100% public and unauthenticated**:
- **Zero Authentication Required**: Designed for direct, frictionless internal team access without login prompts, JWT bearer tokens, or admin keys.
- **Frictionless Incident Posting**: Internal engineers and operators can trigger incidents, post investigation updates, or schedule maintenance announcements directly via `POST /api/incidents`.

---

## 2. 100% Real Live AWS & PostgreSQL Kernel Telemetry

**Zero mock, zero dummy, and zero placeholder data.** Every single metric displayed on the status dashboard and stored in the database is fetched live at runtime directly from the AWS CloudWatch SDK, AWS RDS API, AWS ECS SDK, AWS EC2 SSM SDK, AWS Cognito SDK, and PostgreSQL kernel statistics tables (`pg_stat_activity`).

### Real Telemetry Data Sources Breakdown

| Component | Real Telemetry Metric | Exact Data Source & Mechanism |
| :--- | :--- | :--- |
| **Database Query Latency** | • Live SQL execution roundtrip (e.g. `12 ms`) | Real PostgreSQL `SELECT NOW()` kernel ping execution time |
| **AWS RDS PostgreSQL** | • Instance Class (`db.t4g.small`)<br>• Instance Status (`available`)<br>• Allocated Storage (`130.2 GB`)<br>• Total Active DB Connections (`24`) | `@aws-sdk/client-rds` (`DescribeDBInstances`) + SQL `pg_stat_activity` |
| **CloudWatch Memory & CPU** | • Freeable RAM (`576.39 MB`)<br>• Swap Usage (`0.53 MB`)<br>• CPU Utilization (`3.9%`)<br>• CPU Credit Balance (`40.4`) | `@aws-sdk/client-cloudwatch` (`GetMetricData`) + Datapoint Timestamps |
| **AWS ECS Fargate Container** | • Running Tasks (`1/1`)<br>• Desired Tasks Count<br>• Cluster (`zerpai-cluster`)<br>• Service (`zerpai-backend-service`) | `@aws-sdk/client-ecs` (`DescribeServices`) |
| **AWS EC2 Bastion SSM Tunnel** | • Instance ID (`i-0e8150bdfa767cdb6`)<br>• Instance State (`running`)<br>• SSM DB Tunnel Port (`5433`) | `@aws-sdk/client-ec2` (`DescribeInstances`) |
| **AWS Cognito Identity Provider** | • User Pool ID (`ap-south-2_h1Yyx4i4b`)<br>• User Pool Status (`Enabled`) | `@aws-sdk/client-cognito-identity-provider` (`DescribeUserPool`) |
| **AWS CloudFront CDN & Web Edge** | • Edge Health Check (`Responding OK`)<br>• Handshake Protocol (`HTTPS / TLS 1.3`)<br>• Domain (`erp.zerpai.com`) | Explicit HTTPS HEAD Edge Probe |
| **Neon Serverless PostgreSQL** | • Real-Time Snapshots (`status_snapshots`)<br>• 90-Day Uptime Analytics (`daily_uptime_snapshots`) | `@neondatabase/serverless` SQL Driver |

---

## 3. Dedicated Sub-Minute Probing & Vercel Cron Quota Architecture

### Why Neon Serverless Functions are used instead of Vercel Crons:
- **Vercel Cron Quota Restriction**: Vercel Hobby / Free plan **restricts Cron Jobs to a maximum of once per day (1 execution per 24 hours)**. Vercel rejects sub-minute or hourly crons on free deployments.
- **Neon Serverless Edge Function (`statusprobe`)**: To achieve continuous **30-second availability probing** and **5-minute heavy CloudWatch telemetry collection**, we deploy a dedicated **Neon Serverless Function** (`statusprobe`) directly adjacent to the Neon PostgreSQL database in region `ap-southeast-1`.
- **Read-Only Dashboard Cache Consumer**: The Next.js status page dashboard (`GET /api/status`) is strictly a read-only consumer of Neon DB snapshots. User page refreshes do **not** trigger backend monitoring or CloudWatch queries, preventing sampling bias and excessive AWS API overhead.

---

## 4. Environment Variables Configuration (Vercel)

Add the following keys under **Vercel Project Settings → Environment Variables**:

```env
# Neon PostgreSQL Connection URLs
DATABASE_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
POSTGRES_URL=postgresql://neondb_owner:YOUR_NEON_PASSWORD@ep-xyz-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require

# Backend Health Probe URL
NEXT_PUBLIC_API_URL=https://erp.zerpai.com/api/v1
NEXT_PUBLIC_SITE_TITLE=Zerpai System Infrastructure Status

# AWS Metadata Parameters
AWS_REGION=ap-south-2
AWS_ECS_CLUSTER=zerpai-cluster
AWS_ECS_SERVICE=zerpai-backend-service
AWS_RDS_INSTANCE_ID=zerpai-db
AWS_COGNITO_USER_POOL_ID=ap-south-2_h1Yyx4i4b
AWS_EC2_BASTION_INSTANCE_ID=i-0e8150bdfa767cdb6
```

---

## 5. Local Development & Scripts

- **Run Next.js Dev Server**:
  ```bash
  cd status-page
  npm run dev
  ```
  Open [http://localhost:3002](http://localhost:3002) in your browser.

- **Run 30-Second Continuous Probe Daemon**:
  ```bash
  cd status-page
  npm run probe:daemon
  ```

- **Run Full ERP Dev Stack (4 Tabs)**:
  ```cmd
  start-dev.bat
  ```
  Launches 4 dedicated tabs in Windows Terminal:
  - Tab 1: Flutter Web (Port 53431)
  - Tab 2: NestJS Backend API (Port 3001)
  - Tab 3: AWS RDS DB SSM Tunnel (Port 5433)
  - Tab 4: Next.js Status Page (Port 3002)

---

## 6. API Endpoints Reference

- `GET /api/status`: Reads latest telemetry snapshot from Neon DB (`source: "neon_db_snapshot"`).
- `GET /api/history`: Returns 90-day daily availability history for uptime calendar visualization.
- `GET /api/incidents`: Fetches active incidents & timeline updates from Neon DB.
- `POST /api/incidents`: Public internal endpoint to post new incidents & maintenance announcements.
- `GET /api/cron/probe`: Daily Vercel cron health probe fallback endpoint.

---

## 7. Production Verification Results

- **Live Production URL**: [https://zerpai-status-page.vercel.app](https://zerpai-status-page.vercel.app)
- **Vercel Build**: `npm run build` executed cleanly (`✓ Compiled successfully`, static & edge routes verified).
- **Neon Function**: Deployed `statusprobe` (`nodejs24`, `2048 MiB`) returning HTTP 200 OK.

---

## 8. Neon PostgreSQL Driver Query Standard

- **Parameterized SQL Invocation**: In `@neondatabase/serverless` v1.x, conventional SQL queries with value placeholders (`$1`, `$2`) MUST be invoked using `(sql as any).query(query, params)` or tagged template literals (`sql\`...\``). Calling `sql(query, params)` directly as a function throws a runtime driver exception.
- **Connection String Sanitization**: Strip `channel_binding` flags (`&channel_binding=require`) from connection strings to prevent parameter parsing errors in serverless drivers.
- **Single-Statement DDL Execution**: Multi-statement DDL scripts (`CREATE TABLE...; CREATE TABLE...;`) MUST NOT be executed in a single `queryNeon` call; execute each DDL statement as an isolated query.

---

## 9. Non-False-Green Status Taxonomy Invariants

The status dashboard enforces a strict operational taxonomy to prevent false-green reporting:
- **`operational`**: Confirmed working via a recent, successful authoritative check.
- **`degraded`**: Responding but exhibiting a capacity/performance threshold violation (e.g. query latency > 1000 ms, free memory < 60 MB, or pending instance modifications).
- **`outage`**: Confirmed unavailable via an authoritative check (e.g. 0 running ECS tasks or DB connection failure).
- **`unknown`**: Monitors lack recent evidence, permissions, or upstream connection failures prevent checking (rendered in slate/gray).
- **CloudFront Verification**: CloudFront CDN status is only marked `operational` after a live HTTPS HEAD edge probe succeeds.
- **ECS Attribution**: HTTP probe failures do NOT automatically mark ECS as `outage` unless `DescribeServices` API confirms 0 tasks; otherwise marked as `unknown`.
- **Neon DB Verification**: Neon DB is only marked `operational` when `INSERT INTO status_snapshots` SQL query succeeds in the current cycle.

---

## 10. Dynamic GitHub README Status Badge SVG

Embed a live operational status badge directly into your GitHub `README.md` or internal documentation:

### Markdown Embedding Snippet

```markdown
![Zerpai System Status](https://zerpai-status-page.vercel.app/api/badge.svg)
```

### HTML Embedding Snippet

```html
<a href="https://zerpai-status-page.vercel.app" target="_blank">
  <img src="https://zerpai-status-page.vercel.app/api/badge.svg" alt="Zerpai System Status" />
</a>
```

- **Endpoints**: `GET /api/badge` or `GET /api/badge.svg`
- **Behavior**: Returns a dynamic, no-cache SVG badge (`image/svg+xml`) that reflects live system status (`operational` in green, `degraded` in yellow, `outage` in red, `unverified` in slate gray).


