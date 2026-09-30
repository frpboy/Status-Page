import { queryNeon } from "@/lib/db";

const authoritativeStatuses = new Set(["operational", "degraded", "outage"]);

export function calculateMonthlySla(statuses: readonly string[]) {
  const authoritative = statuses.filter((status) => authoritativeStatuses.has(status));
  if (authoritative.length === 0) return null;

  const successfulChecks = authoritative.filter((status) => status === "operational").length;
  return {
    totalChecks: authoritative.length,
    successfulChecks,
    percentage: ((successfulChecks / authoritative.length) * 100).toFixed(2),
  };
}

const monthlySlaRollupQuery = `
  WITH authoritative_service_checks AS (
    SELECT
      LEFT(COALESCE(NULLIF(service.value->>'name', ''), service.key), 100) AS service_name,
      TO_CHAR(snapshot.created_at AT TIME ZONE 'UTC', 'YYYY-MM') AS month_year,
      CASE WHEN service.value->>'status' = 'operational' THEN 1 ELSE 0 END AS successful_check
    FROM status_snapshots AS snapshot
    CROSS JOIN LATERAL jsonb_each(COALESCE(snapshot.raw_payload->'services', '{}'::jsonb)) AS service(key, value)
    WHERE snapshot.created_at >= DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC')
      AND snapshot.created_at < DATE_TRUNC('month', NOW() AT TIME ZONE 'UTC') + INTERVAL '1 month'
      AND service.value->>'status' IN ('operational', 'degraded', 'outage')
  )
  INSERT INTO subsystem_sla_monthly (
    service_name,
    month_year,
    total_checks,
    successful_checks,
    sla_percentage,
    updated_at
  )
  SELECT
    service_name,
    month_year,
    COUNT(*)::INT,
    SUM(successful_check)::INT,
    ROUND((SUM(successful_check)::NUMERIC / COUNT(*)::NUMERIC) * 100, 2),
    NOW()
  FROM authoritative_service_checks
  GROUP BY service_name, month_year
  ON CONFLICT (service_name, month_year) DO UPDATE SET
    total_checks = EXCLUDED.total_checks,
    successful_checks = EXCLUDED.successful_checks,
    sla_percentage = EXCLUDED.sla_percentage,
    updated_at = EXCLUDED.updated_at
`;

export async function refreshCurrentMonthSla(): Promise<void> {
  await queryNeon(monthlySlaRollupQuery);
}
