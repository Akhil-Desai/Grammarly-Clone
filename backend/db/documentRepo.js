import { pool } from "./pool.js";

export async function createDocument({ userId, content, metadata = null }) {
  // content may be a string or an object; normalize to JSONB
  const contentJson =
    typeof content === "string" ? { text: content } : content || {};
  const query = `
    INSERT INTO documents (user_id, content_jsonb, metadata)
    VALUES ($1, $2, $3)
    RETURNING id, user_id, version, created_at, updated_at
  `;
  const params = [userId, contentJson, metadata];
  const { rows } = await pool.query(query, params);
  return rows[0];
}

export async function listDocumentsByUser({ userId, limit = 20, offset = 0 }) {
  const query = `
    SELECT id,
           (metadata->>'title') AS title,
           version,
           created_at,
           updated_at
    FROM documents
    WHERE user_id = $1
    ORDER BY updated_at DESC
    LIMIT $2 OFFSET $3
  `;
  const params = [userId, limit, offset];
  const { rows } = await pool.query(query, params);
  return rows;
}

export async function updateDocumentContent({ id, userId, content, metadata }) {
  const contentJson =
    typeof content === "string" ? { text: content } : content || {};
  const fields = [];
  const params = [];
  let idx = 1;
  fields.push(`content_jsonb = $${idx++}`);
  params.push(contentJson);
  if (metadata && typeof metadata === "object") {
    fields.push(`metadata = $${idx++}`);
    params.push(metadata);
  }
  // Always bump version and updated_at
  const query = `
    UPDATE documents
    SET ${fields.join(", ")}, version = version + 1, updated_at = now()
    WHERE id = $${idx++} AND user_id = $${idx++}
    RETURNING id, user_id, version, updated_at
  `;
  params.push(id, userId);
  const { rows } = await pool.query(query, params);
  return rows[0] || null;
}


