// Minimal OpenAI provider using Chat Completions API.
// Works without extra SDK dependencies by calling REST directly.
// Env:
// - OPENAI_API_KEY
// - OPENAI_MODEL (default: gpt-4o-mini)
// - OPENAI_BASE_URL (optional; default https://api.openai.com)

export class OpenAIProvider {
  constructor({
    apiKey,
    model = "gpt-4o-mini",
    baseUrl = "https://api.openai.com",
  } = {}) {
    if (!apiKey) throw new Error("Missing OPENAI_API_KEY");
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  async complete({ prompt, temperature = 0.7, maxTokens, forceJson = false }) {
    const resp = await fetch(`${this.baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "authorization": `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: "user", content: String(prompt || "") }],
        temperature,
        ...(typeof maxTokens === "number" ? { max_tokens: maxTokens } : {}),
        ...(forceJson ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    const text = await resp.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!resp.ok) {
      const errMsg = data?.error?.message || text || "OpenAI request failed";
      throw new Error(errMsg);
    }
    const content = data?.choices?.[0]?.message?.content;
    return typeof content === "string" ? content : "";
  }
}

export default OpenAIProvider;


