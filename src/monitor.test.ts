import { beforeEach, expect, it, vi } from "vitest";
import { dispatchInboundDirectDm, resolveInboundDirectDmAccessWithRuntime } from "openclaw/plugin-sdk/channel-inbound";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";
import { saveRemoteMedia } from "openclaw/plugin-sdk/media-runtime";
import { getVkTeamsEvents, getVkTeamsFileInfo, getVkTeamsSelf } from "./api.js";
import { monitorVkTeamsProvider } from "./monitor.js";

vi.mock("openclaw/plugin-sdk/channel-inbound", () => ({
  dispatchInboundDirectDm: vi.fn(),
  resolveInboundDirectDmAccessWithRuntime: vi.fn(),
}));
vi.mock("openclaw/plugin-sdk/channel-pairing", () => ({ createChannelPairingController: vi.fn() }));
vi.mock("openclaw/plugin-sdk/media-runtime", () => ({ saveRemoteMedia: vi.fn() }));
vi.mock("./api.js");
vi.mock("./typing.js", () => ({ withVkTeamsTyping: async (_: unknown, run: () => Promise<void>) => await run() }));

beforeEach(() => vi.resetAllMocks());

it.each([
  { chatType: "private", policy: "allow", delivered: true },
  { chatType: "private", policy: "block", delivered: false },
  { chatType: "group", policy: "allow", delivered: false },
] as const)("handles $chatType attachment with access decision $policy", async ({ chatType, policy, delivered }) => {
  const stop = new AbortController();
  vi.mocked(getVkTeamsSelf).mockResolvedValue({});
  vi.mocked(getVkTeamsEvents).mockResolvedValueOnce({ events: [{ eventId: 1, type: "newMessage", payload: {
    chat: { chatId: "chat", type: chatType }, from: { userId: "alice" },
    parts: [{ type: "file", payload: { fileId: "doc" } }],
  } }] }).mockImplementationOnce(async () => {
    stop.abort();
    return {};
  });
  vi.mocked(resolveInboundDirectDmAccessWithRuntime).mockResolvedValue({
    access: {
      decision: policy,
      reasonCode: policy === "allow" ? "dm_policy_open" : "dm_policy_not_allowlisted",
      reason: "test policy",
      effectiveAllowFrom: [],
    },
    shouldComputeAuth: false,
    senderAllowedForCommands: false,
    commandAuthorized: false,
  });
  vi.mocked(getVkTeamsFileInfo).mockResolvedValue({ url: "https://files.example.test/doc" });
  vi.mocked(saveRemoteMedia).mockResolvedValue({ id: "doc", path: "/media/doc.pdf", contentType: "application/pdf", size: 16 });

  await monitorVkTeamsProvider({
    token: "bot-token",
    account: { accountId: "default", enabled: true, token: "bot-token", tokenSource: "config", config: {} },
    config: {}, runtime: { channel: { commands: {} } } as PluginRuntime, abortSignal: stop.signal, statusSink: vi.fn(),
  });

  expect(getVkTeamsFileInfo).toHaveBeenCalledTimes(Number(delivered));
  expect(dispatchInboundDirectDm).toHaveBeenCalledTimes(Number(delivered));
  if (delivered) expect(dispatchInboundDirectDm).toHaveBeenCalledWith(expect.objectContaining({
    rawBody: "[Файл]", extraContext: {
      MediaPath: "/media/doc.pdf", MediaType: "application/pdf", MediaPaths: ["/media/doc.pdf"], MediaTypes: ["application/pdf"],
    },
  }));
});
