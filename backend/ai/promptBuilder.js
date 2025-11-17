// Very small prompt builder for first integration
// Expands easily with templates and user settings later

export function buildPrompt({ task = "freeform", text = "", settings = {} }) {
  const tone = settings?.tone ? ` Tone: ${settings.tone}.` : "";
  const formality =
    settings?.formality !== undefined
      ? ` Formality: ${settings.formality}.`
      : "";
  const base =
    task === "rewrite"
      ? "Rewrite the following text clearly and concisely while preserving meaning."
      : task === "summarize"
      ? "Summarize the following text in a few sentences."
      : task === "expand"
      ? "Expand the following text with more detail and examples."
      : "Respond helpfully to the user request.";

  const system = `${base}${tone}${formality}`;
  const prompt = `${system}\n\n---\n${String(text || "").trim()}\n---`;
  return prompt;
}

export default { buildPrompt };


