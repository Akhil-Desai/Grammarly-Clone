import dotenv from "dotenv";
dotenv.config();
import { buildPrompt } from "./promptBuilder.js";
import { GeminiProvider } from "./providers/gemini.js";
import { OllamaProvider } from "./providers/ollama.js";
import { AnthropicProvider } from "./providers/anthropic.js";

function getProvider(providerOverride) {
  const provider = (providerOverride || process.env.LLM_PROVIDER || "gemini").toLowerCase();
  if (provider === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    return { name: "gemini", client: new GeminiProvider({
      apiKey,
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    })};
  }
  if (provider === "ollama") {
    const baseUrl = process.env.OLLAMA_URL || "http://localhost:11434";
    return { name: "ollama", client: new OllamaProvider({
      baseUrl,
      model: process.env.OLLAMA_MODEL || "llama3.2:3b",
    })};
  }
  if (provider === "anthropic" || provider === "claude") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    return { name: "anthropic", client: new AnthropicProvider({
      apiKey,
      model: process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest",
      baseUrl: process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com",
      apiVersion: process.env.ANTHROPIC_VERSION || "2023-06-01",
    })};
  }
  // Default to gemini if unspecified/unsupported for now
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  return { name: "gemini", client: new GeminiProvider({
    apiKey,
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
  })};
}

export async function generateAI({ task = "freeform", text = "", settings = {}, options = {}, provider: providerOverride } = {}) {
  const prompt = buildPrompt({ task, text, settings });
  try {
    const { name, client } = getProvider(providerOverride);
    const output = await client.complete({ prompt, ...options });
    return { output, provider: name };
  } catch (e) {
    // Soft fallback for first integration
    const message = e?.message || String(e);
    return {
      output: `Sorry, I couldn't reach the AI provider. Here's a lightly formatted version of your request:\n\n${text}`,
      provider: "fallback",
      error: message,
    };
  }
}

export { buildPrompt };


