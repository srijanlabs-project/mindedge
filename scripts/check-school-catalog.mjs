import "dotenv/config";
import pg from "pg";

const { Client } = pg;

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is missing.");
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  const result = await client.query(`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE status = 'approved')::int AS approved,
      COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
    FROM school_catalog
  `);
  console.log(JSON.stringify(result.rows[0], null, 2));
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
