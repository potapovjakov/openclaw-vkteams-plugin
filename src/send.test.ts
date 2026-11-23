import { describe, expect, it } from "vitest";
import { stripMarkdown } from "openclaw/plugin-sdk/text-chunking";

describe("vkTeamsPlainText", () => {
  it("removes common Markdown formatting while preserving link text", () => {
    expect(stripMarkdown("# **Hello**\n- `code`\n- [docs](https://example.com)", { mode: "plain-text" })).toBe(
      "Hello\n• code\n• docs (https://example.com)",
    );
  });

  it("unwraps fenced code blocks", () => {
    expect(stripMarkdown("```text\nconst answer = 42;\n```", { mode: "plain-text" })).toBe("const answer = 42;");
  });
});
