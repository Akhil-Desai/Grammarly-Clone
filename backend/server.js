import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import { insertUserRow, ensureUserRow } from "./db/userRepo.js";
import { createDocument, listDocumentsByUser, updateDocumentContent } from "./db/documentRepo.js";

dotenv.config();

// Paths and constants
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, ".data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes
const AUTH_SECRET = process.env.JWT_SECRET || process.env.AUTH_SECRET || "dev-secret-change-me";

const app = express();
app.use(cors());
app.use(express.json());

// Ensure data dir exists
async function ensureDataFiles() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {}
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf-8");
  }
}

// Simple file-based user repo
async function readUsers() {
  await ensureDataFiles();
  const raw = await fs.readFile(USERS_FILE, "utf-8");
  const data = JSON.parse(raw);
  return data.users || [];
}

async function writeUsers(users) {
  await ensureDataFiles();
  await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), "utf-8");
}

function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  const [salt, hash] = stored.split(":");
  const computed = crypto.scryptSync(plain, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(computed, "hex"));
}

// Minimal JWT-like token (HS256)
function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function signToken(claims) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS;
  const payload = { ...claims, exp };
  const headerPart = base64url(JSON.stringify(header));
  const payloadPart = base64url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(`${headerPart}.${payloadPart}`)
    .digest("base64url");
  return `${headerPart}.${payloadPart}.${signature}`;
}

function verifyToken(token) {
  try {
    const [headerPart, payloadPart, signature] = token.split(".");
    if (!headerPart || !payloadPart || !signature) return null;
    const expected = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(`${headerPart}.${payloadPart}`)
      .digest("base64url");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf-8"));
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

// Auth middleware
function authenticate(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });
  req.user = { id: payload.sub, email: payload.email, roles: payload.roles || [] };
  next();
}

// Auth routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ error: "Email and password are required" });
    }
    const users = await readUsers();
    const exists = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(409).json({ error: "Email already registered" });
    }
    const user = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashPassword(password),
      roles: ["user"],
      tier: "free",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(user);
    await writeUsers(users);
    // Best-effort: mirror user into Postgres users table
    try {
      await insertUserRow({ id: user.id, email: user.email });
    } catch (e) {
      console.warn("Postgres user insert failed (continuing):", e?.message || e);
    }
    const token = signToken({ sub: user.id, email: user.email, roles: user.roles, tier: user.tier });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, roles: user.roles, tier: user.tier },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Registration failed" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    const users = await readUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid credentials" });
    const token = signToken({ sub: user.id, email: user.email, roles: user.roles, tier: user.tier });
    return res.json({
      token,
      user: { id: user.id, email: user.email, roles: user.roles, tier: user.tier },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Login failed" });
  }
});

app.get("/api/auth/me", async (req, res) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing token" });
  const payload = verifyToken(token);
  if (!payload) return res.status(401).json({ error: "Invalid or expired token" });
  const users = await readUsers();
  const user = users.find((u) => u.id === payload.sub);
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json({ user: { id: user.id, email: user.email, roles: user.roles, tier: user.tier } });
});

// Existing AI route (now protected)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/rewrite", authenticate, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "text is required" });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text }] }],
    });
    res.json({ output: result.response.text() });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gemini API error" });
  }
});

const PORT = Number(process.env.PORT) || 5001;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));

// Documents routes (DB-backed)
app.post("/api/documents", authenticate, async (req, res) => {
  try {
    const { content, metadata } = req.body || {};
    if (content === undefined || content === null) {
      return res.status(400).json({ error: "content is required" });
    }
    // Ensure the current user exists in Postgres (handles legacy file-only users)
    try {
      await ensureUserRow({ id: req.user.id, email: req.user.email });
    } catch {}
    const created = await createDocument({
      userId: req.user.id,
      content,
      metadata: typeof metadata === "object" ? metadata : null,
    });
    return res.status(201).json({ document: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to create document" });
  }
});

app.get("/api/documents", authenticate, async (req, res) => {
  try {
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    const docs = await listDocumentsByUser({ userId: req.user.id, limit, offset });
    return res.json({ documents: docs });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to list documents" });
  }
});

// Fetch a single document
app.get("/api/documents/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "id is required" });
    // Only allow owner to fetch
    const { pool } = await import("./db/pool.js");
    const { rows } = await pool.query(
      `SELECT id, user_id, content_jsonb, metadata, version, created_at, updated_at
       FROM documents
       WHERE id = $1 AND user_id = $2`,
      [id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Document not found" });
    return res.json({ document: rows[0] });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch document" });
  }
});

// Update document content
app.put("/api/documents/:id", authenticate, async (req, res) => {
  try {
    const id = req.params.id;
    const { content, metadata } = req.body || {};
    if (content === undefined || content === null) {
      return res.status(400).json({ error: "content is required" });
    }
    const updated = await updateDocumentContent({
      id,
      userId: req.user.id,
      content,
      metadata: typeof metadata === "object" ? metadata : undefined,
    });
    if (!updated) return res.status(404).json({ error: "Document not found" });
    return res.json({ document: updated });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to update document" });
  }
});
