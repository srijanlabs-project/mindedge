import pg from "pg";

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;

/**
 * Automatically ensures necessary columns exist in the tables to match schema.sql.
 */
export async function runMigrations(pool: pg.Pool): Promise<void> {
  console.log("[Migrations] Running automatic PostgreSQL schema alignment migrations...");
  let client;
  try {
    client = await pool.connect();
  } catch (err: any) {
    console.error("[Migrations] Database connection failed for migrations:", err.message || err);
    return;
  }

  try {
    await client.query("BEGIN;");

    // 1. Ensure core users columns exist
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS relationship VARCHAR(100),
      ADD COLUMN IF NOT EXISTS city VARCHAR(100),
      ADD COLUMN IF NOT EXISTS photo_url TEXT,
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure core columns on therapists exist to match the schema.sql expectation
    await client.query(`
      ALTER TABLE therapists
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS mobile VARCHAR(50),
      ADD COLUMN IF NOT EXISTS photo_url TEXT,
      ADD COLUMN IF NOT EXISTS qualification TEXT,
      ADD COLUMN IF NOT EXISTS experience INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS specialization TEXT,
      ADD COLUMN IF NOT EXISTS languages TEXT,
      ADD COLUMN IF NOT EXISTS sports_expertise TEXT,
      ADD COLUMN IF NOT EXISTS certifications_url TEXT,
      ADD COLUMN IF NOT EXISTS degree_documents_url TEXT,
      ADD COLUMN IF NOT EXISTS identity_proof_url TEXT,
      ADD COLUMN IF NOT EXISTS display_consent BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS service_agreement BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS data_usage_agreement BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS session_fee INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS available_days TEXT[],
      ADD COLUMN IF NOT EXISTS available_time_slots TEXT[],
      ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 60,
      ADD COLUMN IF NOT EXISTS biography TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure core columns on schools exist to match the schema.sql expectation
    await client.query(`
      ALTER TABLE schools
      ADD COLUMN IF NOT EXISTS school_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
      ADD COLUMN IF NOT EXISTS address TEXT,
      ADD COLUMN IF NOT EXISTS number_of_students INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS sports_programs TEXT,
      ADD COLUMN IF NOT EXISTS existing_counselor_details TEXT,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure core columns on students exist to match the schema.sql expectation
    await client.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS parent_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS student_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS age INTEGER DEFAULT 16,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS school VARCHAR(255),
      ADD COLUMN IF NOT EXISTS sport VARCHAR(100),
      ADD COLUMN IF NOT EXISTS competition_level VARCHAR(100),
      ADD COLUMN IF NOT EXISTS training_frequency VARCHAR(100),
      ADD COLUMN IF NOT EXISTS confidence_level INTEGER,
      ADD COLUMN IF NOT EXISTS stress_level INTEGER,
      ADD COLUMN IF NOT EXISTS focus_level INTEGER,
      ADD COLUMN IF NOT EXISTS goals TEXT,
      ADD COLUMN IF NOT EXISTS current_challenges TEXT[],
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // 2. Heal duplicate emails and restore UNIQUE index constraints for pristine data modeling
    await client.query(`
      DO $$
      BEGIN
        -- Heal users duplicates by suffixing secondary violators with their UID segment
        UPDATE users u
        SET email = SPLIT_PART(u.email, '@', 1) || '+migrated-' || SUBSTRING(u.uid FROM 1 FOR 6) || '@' || SPLIT_PART(u.email, '@', 2)
        WHERE u.uid IN (
          SELECT unnest(uids[2:])
          FROM (
            SELECT ARRAY_AGG(uid ORDER BY created_at ASC) as uids
            FROM users
            WHERE email IS NOT NULL AND email <> ''
            GROUP BY email
            HAVING COUNT(*) > 1
          ) sub
        );

        -- Enforce UNIQUE constraint on users email
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        -- Heal therapists duplicates
        UPDATE therapists t
        SET email = SPLIT_PART(t.email, '@', 1) || '+migrated-' || SUBSTRING(t.id FROM 1 FOR 6) || '@' || SPLIT_PART(t.email, '@', 2)
        WHERE t.id IN (
          SELECT unnest(ids[2:])
          FROM (
            SELECT ARRAY_AGG(id ORDER BY id ASC) as ids
            FROM therapists
            WHERE email IS NOT NULL AND email <> ''
            GROUP BY email
            HAVING COUNT(*) > 1
          ) sub
        );

        -- Enforce UNIQUE constraint on therapists email
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'therapists_email_key'
        ) THEN
          ALTER TABLE therapists ADD CONSTRAINT therapists_email_key UNIQUE (email);
        END IF;
      END $$;
    `);

    await client.query(`
      DO $$
      BEGIN
        -- Heal schools duplicates
        UPDATE schools s
        SET email = SPLIT_PART(s.email, '@', 1) || '+migrated-' || SUBSTRING(s.id FROM 1 FOR 6) || '@' || SPLIT_PART(s.email, '@', 2)
        WHERE s.id IN (
          SELECT unnest(ids[2:])
          FROM (
            SELECT ARRAY_AGG(id ORDER BY id ASC) as ids
            FROM schools
            WHERE email IS NOT NULL AND email <> ''
            GROUP BY email
            HAVING COUNT(*) > 1
          ) sub
        );

        -- Enforce UNIQUE constraint on schools email
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'schools_email_key'
        ) THEN
          ALTER TABLE schools ADD CONSTRAINT schools_email_key UNIQUE (email);
        END IF;
      END $$;
    `);

    // 3. Ensure appointments columns are aligned
    await client.query(`
      ALTER TABLE appointments
      ADD COLUMN IF NOT EXISTS therapist_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS therapist_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS booker_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS booker_type VARCHAR(50),
      ADD COLUMN IF NOT EXISTS student_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS student_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS appointment_date DATE,
      ADD COLUMN IF NOT EXISTS time_slot VARCHAR(50),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'requested',
      ADD COLUMN IF NOT EXISTS video_link TEXT,
      ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS session_notes TEXT,
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS order_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50),
      ADD COLUMN IF NOT EXISTS parent_uid VARCHAR(128) REFERENCES users(uid) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure payments columns are aligned
    await client.query(`
      ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS order_id VARCHAR(255),
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS appointment_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(100),
      ADD COLUMN IF NOT EXISTS status VARCHAR(50),
      ADD COLUMN IF NOT EXISTS transaction_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    `);

    // Ensure blogs columns are aligned
    await client.query(`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS author_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS category VARCHAR(100),
      ADD COLUMN IF NOT EXISTS image TEXT,
      ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure journals columns are aligned
    await client.query(`
      ALTER TABLE journals
      ADD COLUMN IF NOT EXISTS student_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS title VARCHAR(255),
      ADD COLUMN IF NOT EXISTS content TEXT,
      ADD COLUMN IF NOT EXISTS mood VARCHAR(100),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    // Ensure notifications columns are aligned
    await client.query(`
      ALTER TABLE notifications
      ADD COLUMN IF NOT EXISTS user_id VARCHAR(128),
      ADD COLUMN IF NOT EXISTS message TEXT,
      ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS type VARCHAR(100),
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `);

    await client.query("COMMIT;");
    console.log("[Migrations] PostgreSQL schema alignment successful! Enforced Unique Email Constraints.");
  } catch (err: any) {
    try {
      await client.query("ROLLBACK;");
    } catch (rbErr) {
      // ignore rollback failure
    }
    console.error("[Migrations] Running migrations failed:", err.message || err);
  } finally {
    client.release();
  }
}

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

    // Run migrations asynchronously when pool is first instantiated!
    runMigrations(poolInstance).catch(err => {
      console.error("[Migrations] Initial async migrations check failed:", err.message || err);
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
    
    // Also trigger runMigrations check during connection tests to heal or align schemas
    await runMigrations(pool).catch((e) => {
      console.warn("[Migrations] Schema alignment failed during db test probe:", e);
    });

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
