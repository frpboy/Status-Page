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
