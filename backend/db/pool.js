import dotenv from "dotenv";
dotenv.config();
import { Pool } from "pg";

// Prefer DATABASE_URL; fall back to discrete env vars
const {
  DATABASE_URL,
  PGHOST,
  PGPORT,
  PGDATABASE,
  PGUSER,
  PGPASSWORD,
  DATABASE_SSL,
  PGSSLMODE,
} = process.env;

const shouldUseSsl =
  (DATABASE_SSL && DATABASE_SSL !== "false") ||
  (PGSSLMODE && PGSSLMODE !== "disable");

const pool = new Pool(
  DATABASE_URL
    ? {
        connectionString: DATABASE_URL,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      }
    : {
        host: PGHOST || "localhost",
        port: PGPORT ? Number(PGPORT) : 5432,
        database: PGDATABASE || "writerly",
        user: PGUSER || "postgres",
        password: PGPASSWORD || undefined,
        ssl: shouldUseSsl ? { rejectUnauthorized: false } : undefined,
      }
);

pool.on("error", (err) => {
  // Bubble unexpected idle client errors to logs
  console.error("PostgreSQL pool error:", err);
});

export { pool };


