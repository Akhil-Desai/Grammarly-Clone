// Minimal Ollama provider for local models
// Requires an Ollama server running (default http://localhost:11434)

export class OllamaProvider {
  constructor({ baseUrl = "http://localhost:11434", model = "llama3.2:3b" } = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.model = model;
  }

  async complete({ prompt, temperature = 0.7, maxTokens }) {
    const resp = await fetch(`${this.baseUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        prompt,
        stream: false,
        options: {
          temperature,
          ...(typeof maxTokens === "number" ? { num_predict: maxTokens } : {}),
        },
      }),
    });
    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!resp.ok) {
      throw new Error(data?.error || text || "Ollama request failed");
    }
    return typeof data?.response === "string" ? data.response : "";
  }
}

export default OllamaProvider;


