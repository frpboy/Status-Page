import assert from "node:assert/strict";
import test from "node:test";

import { getDb } from "@/lib/db";

test("getDb returns null when database connection strings are absent", () => {
  const originalUrl = process.env.DATABASE_URL;
  const originalNeonUrl = process.env.NEON_DATABASE_URL;
  const originalPostgresUrl = process.env.POSTGRES_URL;

  try {
    delete process.env.DATABASE_URL;
    delete process.env.NEON_DATABASE_URL;
    delete process.env.POSTGRES_URL;

    assert.equal(getDb(), null);
  } finally {
    if (originalUrl) process.env.DATABASE_URL = originalUrl;
    if (originalNeonUrl) process.env.NEON_DATABASE_URL = originalNeonUrl;
    if (originalPostgresUrl) process.env.POSTGRES_URL = originalPostgresUrl;
  }
});

test("getDb caches and reuses client instance for identical connection strings", () => {
  const originalUrl = process.env.DATABASE_URL;
  try {
    process.env.DATABASE_URL = "postgresql://user:pass@ep-test-cached.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

    const client1 = getDb();
    const client2 = getDb();

    assert.ok(client1 !== null, "client1 should not be null");
    assert.strictEqual(client1, client2, "getDb must return the same cached instance");
  } finally {
    if (originalUrl) {
      process.env.DATABASE_URL = originalUrl;
    } else {
      delete process.env.DATABASE_URL;
    }
  }
});
