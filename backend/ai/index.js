import dotenv from "dotenv";
dotenv.config();
import { buildPrompt } from "./promptBuilder.js";
import { GeminiProvider } from "./providers/gemini.js";
import { OllamaProvider } from "./providers/ollama.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenAIProvider } from "./providers/openai.js";
import { recordMetric } from "../metrics.js";
import { consumeProvider } from "../ratelimiter.js";

function extractJsonObject(text) {
  if (!text) return null;
  // Strip code fences ```json ... ``` or ``` ... ```
  let t = String(text).trim();
  t = t.replace(/^```json/i, "```");
  if (t.startsWith("```") && t.endsWith("```")) {
    t = t.slice(3, -3).trim();
  }
  // Find first JSON object with "suggestions":[
  const startIdx = t.indexOf("{");
  const endIdx = t.lastIndexOf("}");
  if (startIdx >= 0 && endIdx > startIdx) {
    const candidate = t.slice(startIdx, endIdx + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  // Try more targeted regex for {"suggestions":[...]}
  const match = t.match(/\{[\s\S]*?"suggestions"\s*:\s*\[[\s\S]*?\}\s*\]/);
  if (match) {
    try { return JSON.parse(match[0]); } catch {}
  }
  return null;
}

function unique(arr) {
  const seen = new Set();
  const out = [];
  for (const v of arr) {
    if (v && !seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

function tryMakeProvider(name) {
  try {
    if (name === "openai") {
      const apiKey = process.env.OPENAI_API_KEY;
      return {
        name: "openai",
        client: new OpenAIProvider({
          apiKey,
          model: process.env.OPENAI_MODEL || "gpt-4o-mini",
          baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com",
        }),
      };
    }
    if (name === "gemini") {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      return {
        name: "gemini",
        client: new GeminiProvider({
          apiKey,
          model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest",
        }),
      };
    }
    if (name === "anthropic" || name === "claude") {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      return {
        name: "anthropic",
        client: new AnthropicProvider({
          apiKey,
          model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
          baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
          apiVersion: process.env.ANTHROPIC_VERSION || "2023-06-01",
        }),
      };
    }
    if (name === "ollama") {
      const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
      return {
        name: "ollama",
        client: new OllamaProvider({
          baseUrl,
          model: process.env.OLLAMA_MODEL || "llama3.2:3b-instruct",
        }),
      };
    }
  } catch {
    return null;
  }
  return null;
}

function getProvidersInOrder(providerOverride) {
  // Default chain: openai -> gemini -> anthropic -> ollama
  const defaultOrder = ["openai", "gemini", "anthropic", "ollama"];
  const envPreferred = (process.env.LLM_PROVIDER || "").toLowerCase();
  const override = (providerOverride || "").toLowerCase();
  const names = unique([override, envPreferred, ...defaultOrder]);
  const list = [];
  for (const n of names) {
    const inst = tryMakeProvider(n);
    if (inst && inst.client) list.push(inst);
  }
  return list;
}

export async function generateAI({
  task = "rewrite",
  instruction = "",
  context = "",
  settings = {},
  options = {},
  provider: providerOverride,
  // legacy param `text` is treated as instruction if provided
  text,
  userId,
} = {}) {
  const prompt = buildPrompt({
    task,
    instruction: instruction || text || "",
    context,
    settings,
  });
  try {
    const providers = getProvidersInOrder(providerOverride);
    let lastError = null;
    for (const { name, client } of providers) {
      // Enforce per-user, per-provider RPM before attempting this provider
      try {
        const rate = consumeProvider({ userId: userId || "anon", provider: name });
        if (!rate.allowed) {
          // If the caller explicitly requested this provider, surface rate limit as error
          if (providerOverride) {
            const e = new Error(`Rate limit exceeded for provider: ${name}`);
            e.status = 429;
            e.retryAfterMs = rate.retryAfterMs;
            throw e;
          }
          // Otherwise, try next provider
          lastError = new Error(`Rate limited: ${name}`);
          continue;
        }
      } catch (e) {
        throw e;
      }
      try {
        const started = Date.now();
        const output = await client.complete({
          prompt,
          ...(task === "suggestions" ? { forceJson: true } : {}),
          ...options,
        });
        const elapsed = Date.now() - started;
        // also record per-provider here; server route records global ai metric
        try { recordMetric(`ai:${name}`, elapsed); } catch {}
        if (task === "suggestions") {
          let parsed = null;
          try { parsed = output ? JSON.parse(output) : null; } catch {}
          if (!parsed) parsed = extractJsonObject(output);
          const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
          if (suggestions.length > 0 || output) {
            return { output, provider: name, suggestions, durationMs: elapsed };
          }
          lastError = new Error("No suggestions parsed");
          continue;
        }
        if (output) {
          return { output, provider: name, durationMs: elapsed };
        }
        lastError = new Error("Empty response");
      } catch (e) {
        lastError = e;
        continue;
      }
    }
    throw lastError || new Error("All providers failed");
  } catch (e) {
    const message = e?.message || String(e);
    console.log("error", message);
    return {
      output: `Sorry, I couldn't reach the AI provider. Here's a lightly formatted version of your request:\n\n${text}`,
      provider: "fallback",
      error: message,
    };
  }
}

export { buildPrompt };


