import { GoogleGenerativeAI } from "@google/generative-ai";

export class GeminiProvider {
  constructor({ apiKey, model = "gemini-1.5-flash" } = {}) {
    if (!apiKey) {
      throw new Error("Missing GEMINI_API_KEY");
    }
    this.client = new GoogleGenerativeAI(apiKey);
    this.modelName = model;
  }

  async complete({ prompt, temperature = 0.7, maxTokens, forceJson = false }) {
    const model = this.client.getGenerativeModel({ model: this.modelName });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt } ]}],
      generationConfig: {
        temperature,
        ...(typeof maxTokens === "number" ? { maxOutputTokens: maxTokens } : {}),
        // Try both SDK casing and REST casing; SDK will ignore unknowns
        ...(forceJson ? { responseMimeType: "application/json", response_mime_type: "application/json" } : {}),
      },
    });
    return result?.response?.text?.() || "";
  }
}

export default GeminiProvider;


