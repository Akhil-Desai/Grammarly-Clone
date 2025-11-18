import { buildPrompt } from "../ai/promptBuilder.js";

describe("buildPrompt", () => {
  test("rewrite with context includes document block", () => {
    const p = buildPrompt({ task: "rewrite", instruction: "Improve", context: "Hello\nWorld" });
    expect(p).toMatch(/Document context/);
    expect(p).toMatch(/Hello/);
  });

  test("suggestions task includes JSON schema hint", () => {
    const p = buildPrompt({ task: "suggestions", instruction: "Find issues", context: "text" });
    expect(p).toMatch(/Output JSON schema/);
    expect(p).toMatch(/"suggestions"/);
  });

  test("no context switches to compose mode", () => {
    const p = buildPrompt({ task: "rewrite", instruction: "Write an email", context: "" });
    expect(p).toMatch(/Write the requested content/);
  });
});


