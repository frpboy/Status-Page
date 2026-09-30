import { timingSafeEqual } from "node:crypto";

const incidentStatuses = new Set(["investigating", "identified", "monitoring", "resolved"]);
const incidentImpacts = new Set(["minor", "major", "critical"]);

export class PayloadValidationError extends Error {}

export interface IncidentPayload {
  title: string;
  status: "investigating" | "identified" | "monitoring" | "resolved";
  impact: "minor" | "major" | "critical";
  summary: string | null;
  message: string | null;
}

export interface MaintenancePayload {
  title: string;
  serviceName: string;
  description: string | null;
  scheduledStart: string;
  scheduledEnd: string;
}

function asObject(value: unknown, allowedFields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PayloadValidationError("Request body must be a JSON object.");
  }
  const body = value as Record<string, unknown>;
  const unexpectedField = Object.keys(body).find((field) => !allowedFields.includes(field));
  if (unexpectedField) {
    throw new PayloadValidationError(`Request body contains unexpected field: ${unexpectedField}.`);
  }
  return body;
}

function requiredString(value: unknown, field: string, maximumLength: number): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new PayloadValidationError(`${field} is required.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maximumLength) {
    throw new PayloadValidationError(`${field} must be at most ${maximumLength} characters.`);
  }
  return trimmed;
}

function optionalString(value: unknown, field: string, maximumLength: number): string | null {
  if (value === undefined || value === null || value === "") return null;
  return requiredString(value, field, maximumLength);
}

export function parseIncidentPayload(value: unknown): IncidentPayload {
  const body = asObject(value, ["title", "status", "impact", "summary", "message"]);
  const status = requiredString(body.status, "status", 50);
  const impact = body.impact === undefined ? "minor" : requiredString(body.impact, "impact", 20);

  if (!incidentStatuses.has(status)) {
    throw new PayloadValidationError("status must be investigating, identified, monitoring, or resolved.");
  }
  if (!incidentImpacts.has(impact)) {
    throw new PayloadValidationError("impact must be minor, major, or critical.");
  }

  return {
    title: requiredString(body.title, "title", 255),
    status: status as IncidentPayload["status"],
    impact: impact as IncidentPayload["impact"],
    summary: optionalString(body.summary, "summary", 5_000),
    message: optionalString(body.message, "message", 5_000),
  };
}

export function parseMaintenancePayload(value: unknown): MaintenancePayload {
  const body = asObject(value, ["title", "service_name", "description", "scheduled_start", "scheduled_end"]);
  const scheduledStart = requiredString(body.scheduled_start, "scheduled_start", 64);
  const scheduledEnd = requiredString(body.scheduled_end, "scheduled_end", 64);
  const start = new Date(scheduledStart);
  const end = new Date(scheduledEnd);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new PayloadValidationError("scheduled_start and scheduled_end must be valid ISO dates.");
  }
  if (end <= start) {
    throw new PayloadValidationError("scheduled_end must be after scheduled_start.");
  }

  return {
    title: requiredString(body.title, "title", 255),
    serviceName: body.service_name === undefined ? "All Services" : requiredString(body.service_name, "service_name", 100),
    description: optionalString(body.description, "description", 5_000),
    scheduledStart: start.toISOString(),
    scheduledEnd: end.toISOString(),
  };
}

export function verifyRequiredSecret(expected: string | undefined, authorization: string | null): boolean {
  if (!expected || !authorization?.startsWith("Bearer ")) return false;
  const provided = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  return expectedBuffer.length === providedBuffer.length && timingSafeEqual(expectedBuffer, providedBuffer);
}

export function getRequestClientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const requests = new Map<string, { count: number; resetAt: number }>();

  return {
    check(key: string, now = Date.now()) {
      const existing = requests.get(key);
      const entry = !existing || existing.resetAt <= now
        ? { count: 0, resetAt: now + windowMs }
        : existing;
      entry.count += 1;
      requests.set(key, entry);
      return { allowed: entry.count <= limit, retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1_000)) };
    },
  };
}

export const writeRateLimiter = createRateLimiter({ limit: 10, windowMs: 60_000 });
