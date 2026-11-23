import { describe, expect, it, vi } from "vitest";

const sendVkTeamsText = vi.fn(async () => ({ ok: true }));

vi.mock("./send.js", () => ({
  sendVkTeamsText,
}));

describe("notifyVkTeamsPairingApproval", () => {
  it("uses the non-default account token when accountId is provided", async () => {
    const { notifyVkTeamsPairingApproval } = await import("./channel.runtime.js");

    await notifyVkTeamsPairingApproval({
      cfg: {
        channels: {
          vkteams: {
            botToken: "default-token",
            accounts: {
              team: {
                botToken: "team-token",
              },
            },
          },
        },
      },
      id: "12345",
      accountId: "team",
    });

    expect(sendVkTeamsText).toHaveBeenCalledWith("12345", "OpenClaw: your access has been approved.", {
      token: "team-token",
    });
  });
});
