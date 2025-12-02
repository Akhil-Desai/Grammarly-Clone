// Simple in-memory rate limiter (fixed window per minute) for per-user per-provider limits.
// Not distributed; intended for local/dev use or single-instance deployments.
import dotenv from "dotenv";
dotenv.config();

const windowMs = 60 * 1000;
const store = new Map(); // key -> [timestampsMs...]

function getNow() {
  return Date.now();
}

function pruneOld(list, now) {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < list.length && list[i] <= cutoff) i++;
  if (i > 0) list.splice(0, i);
}

export function getProviderRpm(provider) {
  const name = String(provider || "").toLowerCase();
  if (name === "openai") {
    const v = parseInt(process.env.OPENAI_RPM || "", 10);
    return Number.isFinite(v) && v > 0 ? v : 60;
  }
  if (name === "gemini") {
    const v = parseInt(process.env.GEMINI_RPM || "", 10);
    return Number.isFinite(v) && v > 0 ? v : 60;
  }
  if (name === "anthropic" || name === "claude") {
    const v = parseInt(process.env.ANTHROPIC_RPM || "", 10);
    return Number.isFinite(v) && v > 0 ? v : 60;
  }
  // Default for unknown providers
  const v = parseInt(process.env.DEFAULT_LLM_RPM || "", 10);
  return Number.isFinite(v) && v > 0 ? v : 60;
}

export function consumeKey({ key, limit }) {
  const now = getNow();
  const list = store.get(key) || [];
  pruneOld(list, now);
  if (list.length >= limit) {
    const resetAt = list[0] + windowMs;
    const retryAfterMs = Math.max(0, resetAt - now);
    return { allowed: false, remaining: 0, retryAfterMs, resetAt };
  }
  list.push(now);
  store.set(key, list);
  const remaining = Math.max(0, limit - list.length);
  const resetAt = list[0] + windowMs;
  return { allowed: true, remaining, retryAfterMs: 0, resetAt };
}

export function consumeProvider({ userId = "anon", provider }) {
  const prov = String(provider || "").toLowerCase();
  const limit = getProviderRpm(prov);
  const key = `prov:${prov}:user:${userId}`;
  return { ...consumeKey({ key, limit }), limit, key };
}

export function rateHeaders(info) {
  // Map runtime info to standard-ish headers
  const headers = {};
  if (typeof info?.limit === "number") headers["X-RateLimit-Limit"] = String(info.limit);
  if (typeof info?.remaining === "number") headers["X-RateLimit-Remaining"] = String(info.remaining);
  if (typeof info?.resetAt === "number") headers["X-RateLimit-Reset"] = String(Math.ceil(info.resetAt / 1000));
  return headers;
}

export default {
  getProviderRpm,
  consumeKey,
  consumeProvider,
  rateHeaders,
};


