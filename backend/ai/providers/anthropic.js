// Minimal Anthropic provider (Claude) using fetch to the Messages API
// Docs: https://docs.anthropic.com/claude/reference/messages_post

export class AnthropicProvider {
  constructor({
    apiKey,
    model = "claude-3-5-haiku-latest",
    baseUrl = "https://api.anthropic.com",
    apiVersion = "2023-06-01",
  } = {}) {
    if (!apiKey) throw new Error("Missing ANTHROPIC_API_KEY");
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.apiVersion = apiVersion;
  }

  async complete({ prompt, temperature = 0.7, maxTokens = 512 }) {
    const resp = await fetch(`${this.baseUrl}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": this.apiVersion,
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: maxTokens,
        temperature,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!resp.ok) {
      throw new Error(data?.error?.message || text || "Anthropic request failed");
    }
    // Concatenate text parts
    const parts = Array.isArray(data?.content) ? data.content : [];
    const combined = parts
      .map((p) => (p?.type === "text" ? p.text : ""))
      .filter(Boolean)
      .join("");
    return combined;
  }
}

export default AnthropicProvider;


