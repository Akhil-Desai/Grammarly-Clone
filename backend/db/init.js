import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "./pool.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCHEMA_PATH = path.join(__dirname, "..", "schema.sql");

export async function initDb() {
  console.log("Applying schema:", SCHEMA_PATH);
  const sql = await fs.readFile(SCHEMA_PATH, "utf-8");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(sql);
    await client.query("COMMIT");
    console.log("Database initialized (schema applied).");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Database init failed:", err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow running directly: `node db/init.js`
if (import.meta.url === `file://${__filename}`) {
  initDb()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}


