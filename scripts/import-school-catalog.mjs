import "dotenv/config";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import pg from "pg";

const { Client } = pg;

const jsonPath = process.argv[2];

if (!jsonPath) {
  console.error("Usage: node scripts/import-school-catalog.mjs <schools.json>");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const source = await readFile(jsonPath, "utf8");
const rows = JSON.parse(source);

if (!Array.isArray(rows) || rows.length === 0) {
  console.error("Input JSON must be a non-empty array.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(`
    CREATE TABLE IF NOT EXISTS school_catalog (
      id VARCHAR(128) PRIMARY KEY,
      school_name VARCHAR(255) NOT NULL,
      location VARCHAR(255),
      city VARCHAR(100),
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      submitted_by_uid VARCHAR(128),
      approved_by_uid VARCHAR(128),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await client.query("BEGIN");

  let imported = 0;

  for (const row of rows) {
    const schoolName = String(row.schoolName || "").trim();
    const location = String(row.location || "").trim();
    const city = String(row.city || "").trim();

    if (!schoolName) {
      continue;
    }

    const existing = await client.query(
      `
        SELECT id
        FROM school_catalog
        WHERE LOWER(school_name) = LOWER($1)
          AND LOWER(COALESCE(city, '')) = LOWER($2)
        LIMIT 1
      `,
      [schoolName, city],
    );

    if (existing.rowCount) {
      await client.query(
        `
          UPDATE school_catalog
          SET location = $1,
              city = $2,
              status = 'approved',
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `,
        [location || null, city || null, existing.rows[0].id],
      );
    } else {
      await client.query(
        `
          INSERT INTO school_catalog (
            id, school_name, location, city, status, created_at, updated_at
          )
          VALUES ($1, $2, $3, $4, 'approved', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `,
        [`schoolcat_${randomUUID().replace(/-/g, "").slice(0, 20)}`, schoolName, location || null, city || null],
      );
    }

    imported += 1;
  }

  await client.query("COMMIT");

  const totals = await client.query(
    "SELECT COUNT(*)::int AS total_approved FROM school_catalog WHERE status = 'approved'",
  );

  console.log(JSON.stringify({
    imported,
    totalApproved: totals.rows[0]?.total_approved || 0,
  }, null, 2));
} catch (error) {
  await client.query("ROLLBACK").catch(() => {});
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
