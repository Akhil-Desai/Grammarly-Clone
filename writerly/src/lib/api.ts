// Minimal client for backend auth and AI endpoints for demo/testing.
// Stores a temporary token in localStorage and reuses it across calls.
export type GenerateOptions = {
  provider?: "openai" | "gemini" | "anthropic" | string;
  text: string;
  task?: "rewrite" | "suggestions";
};

const BACKEND_URL =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_BACKEND_URL) ||
  "https://grammarly-clone.onrender.com";

function getStoredToken(): string | null {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

function setStoredToken(token: string) {
  try {
    localStorage.setItem("auth_token", token);
  } catch {}
}

function randomEmail(): string {
  const id = Math.random().toString(36).slice(2);
  return `demo_${id}@example.com`;
}

export async function ensureAuthToken(): Promise<string> {
  const existing = getStoredToken();
  if (existing) return existing;
  const email = randomEmail();
  const password = "demo-Password123!";
  const resp = await fetch(`${BACKEND_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const text = await resp.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!resp.ok || !data?.token) {
    throw new Error(data?.error || text || "Failed to register demo user");
  }
  setStoredToken(data.token);
  return data.token;
}

export async function callRewrite(text: string): Promise<string> {
  const token = await ensureAuthToken();
  const resp = await fetch(`${BACKEND_URL}/api/rewrite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({ text }),
  });
  const raw = await resp.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!resp.ok) {
    const msg = data?.error || raw || `HTTP ${resp.status}`;
    const err: any = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  return data?.output || "";
}

export async function callGenerate(opts: GenerateOptions): Promise<{ text: string; provider?: string; status?: number; }> {
  const token = await ensureAuthToken();
  const resp = await fetch(`${BACKEND_URL}/api/ai/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: opts.provider,
      text: opts.text,
      task: opts.task || "rewrite",
    }),
  });
  const raw = await resp.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch {}
  if (!resp.ok) {
    const msg = data?.error || raw || `HTTP ${resp.status}`;
    const err: any = new Error(msg);
    err.status = resp.status;
    throw err;
  }
  return { text: data?.text || "", provider: data?.meta?.provider, status: resp.status };
}
