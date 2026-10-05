export const LATEST_SNAPSHOT_ORDER = "created_at DESC, id DESC";

export type Status = "operational" | "degraded" | "outage" | "unknown" | "stale";

const supportedStatuses = new Set<Status>(["operational", "degraded", "outage", "unknown", "stale"]);

export function getServiceStatus(value: unknown): Status {
  return typeof value === "string" && supportedStatuses.has(value as Status)
    ? value as Status
    : "unknown";
}

export function getDisplayedOverallStatus(value: unknown, snapshotAgeMs: number): Status {
  if (!Number.isFinite(snapshotAgeMs) || snapshotAgeMs < -5_000) return "unknown";
  const status = getServiceStatus(value);
  if (status !== "unknown" && snapshotAgeMs > 300_000) return "stale";
  return status;
}

export function getDisplayedServices(services: Record<string, any> = {}, snapshotAgeMs: number) {
  return Object.fromEntries(Object.entries(services).map(([key, service]) => [key, {
    ...service,
    status: getDisplayedOverallStatus(service?.status, snapshotAgeMs),
  }]));
}
