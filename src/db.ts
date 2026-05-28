import pg from "pg";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

/**
 * Lazily configures and returns the PostgreSQL connection pool.
 * Uses the DATABASE_URL environment variable.
 */
export function getDbPool(): pg.Pool {
  if (!poolInstance) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error(
        "DATABASE_URL is missing. Please make sure to add DATABASE_URL to your environment variables."
      );
    }

    // Defensive check: If they are using a Railway internal URL, we should warn them!
    if (dbUrl.includes("railway.internal")) {
      console.warn(
        "CRITICAL DATABASE CONFIGURATION WARNING: Your DATABASE_URL appears to contain 'railway.internal'. " +
        "Since the AI Studio application runs on Google Cloud Run (outside of Railway's virtual private network), " +
        "internal URLs are NOT accessible. You MUST use the Public URL (e.g., containing '.proxy.rlwy.net' as host) instead!"
      );
    }

    poolInstance = new Pool({
      connectionString: dbUrl,
      // Add secure, responsive timeout guards
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      max: 10,
      ssl: dbUrl.includes("sslmode=require") || !dbUrl.includes("localhost") 
        ? { rejectUnauthorized: false } 
        : false,
    });

    poolInstance.on("error", (err) => {
      console.error("Unexpected error on idle PostgreSQL client:", err);
    });
  }

  return poolInstance;
}

/**
 * Probes the PostgreSQL connection to check if it's alive, returns connection metrics or diagnostics.
 */
export async function testDbConnection(): Promise<{
  success: boolean;
  message: string;
  database?: string;
  hasTables?: boolean;
}> {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return {
      success: false,
      message: "DATABASE_URL environment variable is not defined.",
    };
  }

  if (dbUrl.includes("railway.internal")) {
    return {
      success: false,
      message:
        "The connection URL uses Railway internal domain (railway.internal). This is only accessible within Railway, NOT from external networks (like Cloud Run). Please use Railway's Public TCP Proxy/Service URL instead.",
    };
  }

  try {
    const pool = getDbPool();
    const result = await pool.query("SELECT current_database(), now();");
    const dbName = result.rows[0]?.current_database || "unknown";

    // Query list of tables in public schema as extra diagnostics
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);

    const tableNames = tablesResult.rows.map((row) => row.table_name);

    return {
      success: true,
      message: `Successfully connected to PostgreSQL database!`,
      database: dbName,
      hasTables: tableNames.length > 0,
    };
  } catch (error: any) {
    console.error("Database connection probe failed:", error);
    return {
      success: false,
      message: `Failed to connect with the provided DATABASE_URL. Error: ${error.message || error}`,
    };
  }
}
