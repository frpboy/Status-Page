# Entity Relationship Diagram & Schema Document (ERD)
## Zerpai Status Page Telemetry Engine

---

## 1. Database Entity Relationship Diagram

```mermaid
erDiagram
    incidents ||--o{ incident_updates : "has updates"
    status_snapshots ||--o{ subsystem_latency_metrics : "records"
    
    status_snapshots {
        uuid id PK
        timestamptz timestamp
        timestamptz created_at
        varchar backend_status
        varchar database_status
        int latency_ms
        text error_message
        jsonb raw_payload
    }

    incidents {
        uuid id PK
        varchar title
        varchar status
        varchar impact
        text summary
        timestamptz started_at
        timestamptz resolved_at
        timestamptz created_at
        timestamptz updated_at
    }

    incident_updates {
        uuid id PK
        uuid incident_id FK
        text message
        varchar status
        timestamptz created_at
    }

    daily_uptime_snapshots {
        date date PK
        numeric uptime_percentage
        int total_pings
        int successful_pings
        int avg_latency_ms
        timestamptz updated_at
    }

    subsystem_latency_metrics {
        uuid id PK
        varchar service_name
        int latency_ms
        int status_code
        timestamptz recorded_at
    }

    telemetry_threshold_alerts {
        uuid id PK
        varchar alert_type
        varchar severity
        varchar metric_name
        numeric metric_value
        numeric threshold_value
        text details
        timestamptz created_at
    }

    scheduled_maintenances {
        uuid id PK
        varchar title
        varchar service_name
        varchar status
        text description
        timestamptz scheduled_start
        timestamptz scheduled_end
        timestamptz created_at
        timestamptz updated_at
    }

    subsystem_sla_monthly {
        uuid id PK
        varchar service_name
        varchar month_year
        int total_checks
        int successful_checks
        numeric sla_percentage
        timestamptz updated_at
    }
```

---

## 2. Table Specifications

### 2.1 Table: `status_snapshots`
- **Purpose**: Stores periodic full system health snapshots emitted by background probes.
- **Columns**:
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `timestamp`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
  - `backend_status`: `VARCHAR(20) NOT NULL` ('operational', 'degraded', 'outage')
  - `database_status`: `VARCHAR(20) NOT NULL`
  - `latency_ms`: `INT NOT NULL DEFAULT 0`
  - `error_message`: `TEXT NULL`
  - `raw_payload`: `JSONB NULL` (Contains nested details for ECS, RDS, Redis, Cognito, CloudFront, Bastion)

### 2.2 Table: `daily_uptime_snapshots`
- **Purpose**: Aggregated 90-day daily uptime history used to build the uptime bar grid.
- **Columns**:
  - `date`: `DATE PRIMARY KEY`
  - `uptime_percentage`: `NUMERIC(5, 2) NOT NULL DEFAULT 100.00`
  - `total_pings`: `INT NOT NULL DEFAULT 0`
  - `successful_pings`: `INT NOT NULL DEFAULT 0`
  - `avg_latency_ms`: `INT NOT NULL DEFAULT 0`

### 2.3 Table: `subsystem_sla_monthly`
- **Purpose**: Tracks monthly uptime compliance percentages per subsystem against target SLAs.
- **Columns**:
  - `id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
  - `service_name`: `VARCHAR(100) NOT NULL`
  - `month_year`: `VARCHAR(7) NOT NULL` (e.g. `'2026-09'`)
  - `total_checks`: `INT NOT NULL DEFAULT 0`
  - `successful_checks`: `INT NOT NULL DEFAULT 0`
  - `sla_percentage`: `NUMERIC(5, 2) NOT NULL DEFAULT 100.00`
  - **Constraints**: `UNIQUE(service_name, month_year)`
