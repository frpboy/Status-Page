import { neon } from "@neondatabase/serverless";

export function getDb() {
  let connectionString =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL;

  if (!connectionString) {
    return null;
  }

  // Clean connection string parameter for JS driver compatibility
  connectionString = connectionString
    .replace(/&channel_binding=[^&]+/g, "")
    .replace(/\?channel_binding=[^&]+&?/g, "?");

  try {
    return neon(connectionString);
  } catch (err) {
    console.error("[Neon DB] Failed to initialize Neon connection:", err);
    return null;
  }
}

export async function queryNeon<T = Record<string, any>>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  const sql = getDb();
  if (!sql) {
    throw new Error("Neon database connection string unconfigured");
  }

  // Execute via sql.query for @neondatabase/serverless v1.x conventional query compatibility
  const sqlFn = (sql as any).query ? (sql as any).query.bind(sql) : (sql as any);
  const result = params && params.length > 0
    ? await sqlFn(query, params)
    : await sqlFn(query);
  return (result as T[]) || [];
}
