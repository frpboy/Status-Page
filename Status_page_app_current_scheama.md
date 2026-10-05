CREATE SCHEMA "public";
CREATE TABLE "daily_uptime_snapshots" (
	"date" date PRIMARY KEY,
	"uptime_percentage" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"total_pings" integer DEFAULT 0 NOT NULL,
	"successful_pings" integer DEFAULT 0 NOT NULL,
	"avg_latency_ms" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "incident_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"incident_id" uuid NOT NULL,
	"message" text NOT NULL,
	"status" varchar(50) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"status" varchar(50) DEFAULT 'investigating' NOT NULL,
	"impact" varchar(20) DEFAULT 'minor' NOT NULL,
	"summary" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "scheduled_maintenances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"title" varchar(255) NOT NULL,
	"service_name" varchar(100) DEFAULT 'All Services' NOT NULL,
	"status" varchar(50) DEFAULT 'scheduled' NOT NULL,
	"description" text,
	"scheduled_start" timestamp with time zone NOT NULL,
	"scheduled_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "status_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"backend_status" varchar(20) NOT NULL,
	"database_status" varchar(20) NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"error_message" text,
	"raw_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "subsystem_latency_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_name" varchar(100) NOT NULL,
	"latency_ms" integer DEFAULT 0 NOT NULL,
	"status_code" integer DEFAULT 200 NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE "subsystem_sla_monthly" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"service_name" varchar(100) NOT NULL,
	"month_year" varchar(7) NOT NULL,
	"total_checks" integer DEFAULT 0 NOT NULL,
	"successful_checks" integer DEFAULT 0 NOT NULL,
	"sla_percentage" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subsystem_sla_monthly_service_name_month_year_key" UNIQUE("service_name","month_year")
);
CREATE TABLE "telemetry_threshold_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"alert_type" varchar(50) NOT NULL,
	"severity" varchar(20) DEFAULT 'warning' NOT NULL,
	"metric_name" varchar(100) NOT NULL,
	"metric_value" numeric(10, 2) NOT NULL,
	"threshold_value" numeric(10, 2) NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX "daily_uptime_snapshots_pkey" ON "daily_uptime_snapshots" ("date");
CREATE INDEX "idx_incident_updates_incident_id" ON "incident_updates" ("incident_id");
CREATE UNIQUE INDEX "incident_updates_pkey" ON "incident_updates" ("id");
CREATE INDEX "idx_incidents_created_at" ON "incidents" ("created_at");
CREATE INDEX "idx_incidents_status" ON "incidents" ("status");
CREATE UNIQUE INDEX "incidents_pkey" ON "incidents" ("id");
CREATE UNIQUE INDEX "scheduled_maintenances_pkey" ON "scheduled_maintenances" ("id");
CREATE INDEX "idx_status_snapshots_created_at" ON "status_snapshots" ("created_at","id");
CREATE INDEX "idx_status_snapshots_timestamp" ON "status_snapshots" ("timestamp");
CREATE UNIQUE INDEX "status_snapshots_pkey" ON "status_snapshots" ("id");
CREATE UNIQUE INDEX "subsystem_latency_metrics_pkey" ON "subsystem_latency_metrics" ("id");
CREATE UNIQUE INDEX "subsystem_sla_monthly_pkey" ON "subsystem_sla_monthly" ("id");
CREATE UNIQUE INDEX "subsystem_sla_monthly_service_name_month_year_key" ON "subsystem_sla_monthly" ("service_name","month_year");
CREATE UNIQUE INDEX "telemetry_threshold_alerts_pkey" ON "telemetry_threshold_alerts" ("id");
ALTER TABLE "incident_updates" ADD CONSTRAINT "incident_updates_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE;