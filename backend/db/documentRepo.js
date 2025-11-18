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

export async function softDeleteDocument({ id, userId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Move row to deleted_documents
    const sel = await client.query(
      `SELECT id, user_id, content_jsonb, metadata, version, created_at, updated_at
       FROM documents WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (sel.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    const d = sel.rows[0];
    await client.query(
      `INSERT INTO deleted_documents (id, user_id, content_jsonb, metadata, version, created_at, updated_at, deleted_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7, now())
       ON CONFLICT (id) DO NOTHING`,
      [d.id, d.user_id, d.content_jsonb, d.metadata, d.version, d.created_at, d.updated_at]
    );
    await client.query(`DELETE FROM documents WHERE id = $1 AND user_id = $2`, [id, userId]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function listDeletedDocumentsByUser({ userId, limit = 20, offset = 0 }) {
  const { rows } = await pool.query(
    `SELECT id,
            (metadata->>'title') AS title,
            deleted_at
     FROM deleted_documents
     WHERE user_id = $1
     ORDER BY deleted_at DESC
     LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );
  return rows;
}

export async function restoreDeletedDocument({ id, userId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const sel = await client.query(
      `SELECT id, user_id, content_jsonb, metadata, version, created_at, updated_at
       FROM deleted_documents WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );
    if (sel.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    const d = sel.rows[0];
    await client.query(
      `INSERT INTO documents (id, user_id, content_jsonb, metadata, version, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6, now())
       ON CONFLICT (id) DO UPDATE SET
         content_jsonb = EXCLUDED.content_jsonb,
         metadata = EXCLUDED.metadata,
         version = EXCLUDED.version,
         updated_at = now()`,
      [d.id, d.user_id, d.content_jsonb, d.metadata, Math.max(1, (d.version || 1)), d.created_at]
    );
    await client.query(`DELETE FROM deleted_documents WHERE id = $1 AND user_id = $2`, [id, userId]);
    await client.query("COMMIT");
    return true;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function purgeDeletedDocument({ id, userId }) {
  const { rowCount } = await pool.query(
    `DELETE FROM deleted_documents WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );
  return rowCount > 0;
}


