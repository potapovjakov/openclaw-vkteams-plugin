import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyVkTeamsPairingApproval } from "./channel.runtime.js";

const cfg = {
  channels: {
    vkteams: {
      botToken: "default-token",
      apiBaseUrl: "https://default.example.test/bot/v1",
      accounts: {
        team: { botToken: "team-token", apiBaseUrl: "https://team.example.test/bot/v1" },
      },
    },
  },
};

describe("notifyVkTeamsPairingApproval", () => {
  afterEach(() => vi.unstubAllGlobals());

  it.each([
    { accountId: undefined, origin: "https://default.example.test", token: "default-token" },
    { accountId: "team", origin: "https://team.example.test", token: "team-token" },
  ])("uses the configured endpoint and token for account $accountId", async ({ accountId, origin, token }) => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: true }));
    vi.stubGlobal("fetch", fetchMock);

    await notifyVkTeamsPairingApproval({ cfg, id: "12345", accountId });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [input, options] = fetchMock.mock.calls[0];
    const url = new URL(String(input));
    expect(url.origin).toBe(origin);
    expect(url.pathname).toBe("/bot/v1/messages/sendText");
    expect(url.searchParams.get("token")).toBe(token);
    expect(url.searchParams.get("chatId")).toBe("12345");
    expect(options?.redirect).toBe("manual");
  });

  it("does not send credentials over HTTP", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    vi.stubGlobal("fetch", fetchMock);
    const insecureConfig = { channels: { vkteams: { ...cfg.channels.vkteams, apiBaseUrl: "http://default.example.test/bot/v1" } } };

    await expect(notifyVkTeamsPairingApproval({ cfg: insecureConfig, id: "12345" })).rejects.toThrow("API URL must use HTTPS");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not surface raw API error descriptions", async () => {
    vi.stubGlobal("fetch", vi.fn<typeof fetch>().mockResolvedValue(Response.json({ ok: false, description: "default-token" })));

    await expect(notifyVkTeamsPairingApproval({ cfg, id: "12345" })).rejects.toMatchObject({
      message: "VK Teams API error: request failed",
    });
  });
});
