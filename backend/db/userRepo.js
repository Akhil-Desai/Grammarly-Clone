import { pool } from "./pool.js";

export async function insertUserRow({ id, email, settings = null }) {
  // Insert using primary key conflict target (id). This avoids relying on a functional unique index.
  const query = `
    INSERT INTO users (id, email, settings)
    VALUES ($1, $2, $3)
    ON CONFLICT (id) DO NOTHING
    RETURNING id, email, created_at
  `;
  const params = [id || null, email, settings];
  try {
    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  } catch (e) {
    // If a separate unique constraint/index on email fires, swallow and fall through.
    return null;
  }
}

export async function ensureUserRow({ id, email }) {
  // Fast path: does the id already exist?
  const exists = await pool.query("SELECT 1 FROM users WHERE id = $1", [id]);
  if (exists.rowCount > 0) return true;
  try {
    await pool.query("INSERT INTO users (id, email) VALUES ($1, $2)", [id, email]);
    return true;
  } catch (e) {
    // Unique violations on email or id can happen; treat as exists and continue
    return true;
  }
}

export async function getUserSettings(userId) {
  const { rows } = await pool.query("SELECT settings FROM users WHERE id = $1", [userId]);
  if (rows.length === 0) return null;
  return rows[0]?.settings || null;
}

export async function updateUserSettings(userId, settings) {
  const { rows } = await pool.query(
    "UPDATE users SET settings = $2 WHERE id = $1 RETURNING settings",
    [userId, settings || null]
  );
  return rows[0]?.settings || null;
}


