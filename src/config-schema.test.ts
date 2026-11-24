import { describe, expect, it } from "vitest";
import { VkTeamsConfigSchema } from "./config-schema.js";

const parse = (value: unknown) => VkTeamsConfigSchema.runtime!.safeParse(value);

describe("VK Teams configuration schema", () => {
  it("accepts a token, named accounts and all supported secret reference types", () => {
    const config = {
      botToken: "test-token",
      allowFrom: ["123", 456],
      apiBaseUrl: "https://example.test/bot/v1",
      pollTime: 60,
      defaultAccount: "team",
      accounts: {
        team: { botToken: { source: "env", provider: "default", id: "VK_TEAMS_TOKEN" } },
        store: { botToken: { source: "store", provider: "default", id: "VK_TEAMS_TOKEN" } },
        file: { botToken: { source: "file", provider: "default", id: "/bots/vk~1teams" } },
        exec: { botToken: { source: "exec", provider: "default", id: "vault/vkteams/token" } },
      },
    };

    expect(parse(config)).toEqual({ success: true, data: config });
  });

  it.each([
    { apiBaseUrl: "not-a-url" },
    { pollTime: 121 },
    { accounts: { team: { pollTime: 1.5 } } },
    { accounts: { team: { botToken: { source: "env", provider: "default", id: "invalid-id" } } } },
    { botToken: { source: "file", provider: "default", id: "/bad~2key" } },
    { botToken: { source: "exec", provider: "default", id: "vault/../token" } },
  ])("rejects invalid config: %j", (config) => {
    expect(parse(config)?.success).toBe(false);
  });

  it("marks tokens as sensitive at both configuration levels", () => {
    expect(VkTeamsConfigSchema.uiHints?.botToken?.sensitive).toBe(true);
    expect(VkTeamsConfigSchema.uiHints?.["accounts.*.botToken"]?.sensitive).toBe(true);
  });
});
