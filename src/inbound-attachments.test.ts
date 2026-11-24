import { beforeEach, describe, expect, it, vi } from "vitest";
import { saveRemoteMedia } from "openclaw/plugin-sdk/media-runtime";
import { getVkTeamsFileInfo } from "./api.js";
import { getVkTeamsAttachments, loadVkTeamsAttachments } from "./inbound-attachments.js";

vi.mock("openclaw/plugin-sdk/media-runtime", () => ({ saveRemoteMedia: vi.fn() }));
vi.mock("./api.js", () => ({ getVkTeamsFileInfo: vi.fn() }));

const getInfo = vi.mocked(getVkTeamsFileInfo);
const save = vi.mocked(saveRemoteMedia);
const pdfUrl = "https://files.example.test/report?secret=download-signature";
const options = () => ({
  apiBaseUrl: "https://api.example.test/bot/v1",
  token: "bot-token",
  signal: new AbortController().signal,
  onSkip: vi.fn(),
});

describe("VK Teams inbound attachments", () => {
  beforeEach(() => vi.resetAllMocks());

  it("delivers a PDF without payload.type using the saved MIME and no remote URL", async () => {
    getInfo.mockResolvedValue({ filename: "report.pdf", url: pdfUrl });
    save.mockResolvedValue({ id: "pdf", path: "/media/report.pdf", contentType: "application/pdf", size: 20 });
    const p = options();
    const attachments = getVkTeamsAttachments([{ type: "file", payload: { fileId: "pdf" } }]);

    await expect(loadVkTeamsAttachments({ ...p, attachments, text: "" })).resolves.toEqual({
      body: "[Файл]",
      context: { MediaPath: "/media/report.pdf", MediaType: "application/pdf", MediaPaths: ["/media/report.pdf"], MediaTypes: ["application/pdf"] },
    });
    expect(getInfo).toHaveBeenCalledWith({ apiBaseUrl: p.apiBaseUrl, token: p.token, fileId: "pdf", signal: expect.any(AbortSignal) });
    expect(save).toHaveBeenCalledWith({
      url: pdfUrl, originalFilename: "report.pdf", filePathHint: "report.pdf",
      requireHttps: true, maxBytes: 25 * 1024 * 1024, requestInit: { signal: expect.any(AbortSignal) },
    });
  });

  it("delivers a standalone voice message and ignores unrelated or incomplete parts", async () => {
    getInfo.mockResolvedValue({ url: "https://files.example.test/voice" });
    save.mockResolvedValue({ id: "voice", path: "/media/voice.ogg", contentType: "audio/ogg", size: 20 });
    const attachments = getVkTeamsAttachments([
      { type: "sticker", payload: { fileId: "sticker" } },
      { type: "file", payload: { fileId: " " } },
      { type: "voice", payload: { fileId: "voice" } },
    ]);

    await expect(loadVkTeamsAttachments({ ...options(), attachments, text: "" })).resolves.toMatchObject({
      body: "[Голосовое сообщение]",
      context: { MediaPaths: ["/media/voice.ogg"], MediaTypes: ["audio/ogg"] },
    });
    expect(getInfo).toHaveBeenCalledTimes(1);
  });

  it("keeps text, captions and successful attachments when other files fail", async () => {
    getInfo
      .mockResolvedValueOnce({ url: pdfUrl })
      .mockResolvedValueOnce({ url: pdfUrl, size: 26 * 1024 * 1024 })
      .mockResolvedValueOnce({ url: pdfUrl })
      .mockResolvedValueOnce({ url: pdfUrl });
    save
      .mockRejectedValueOnce(new Error(pdfUrl))
      .mockResolvedValueOnce({ id: "image", path: "/media/photo.png", contentType: "image/png", size: 10 })
      .mockResolvedValueOnce({ id: "video", path: "/media/video.mp4", size: 10 });
    const p = options();
    const attachments = getVkTeamsAttachments([
      { type: "file", payload: { fileId: "broken" } },
      { type: "file", payload: { fileId: "large" } },
      { type: "file", payload: { fileId: "image", type: "image", caption: " Подпись " } },
      { type: "file", payload: { fileId: "video", type: "video", caption: "Текст" } },
    ]);

    await expect(loadVkTeamsAttachments({ ...p, attachments, text: "Текст" })).resolves.toMatchObject({
      body: "Текст\n\nПодпись",
      context: { MediaPaths: ["/media/photo.png", "/media/video.mp4"], MediaTypes: ["image/png", "application/octet-stream"] },
    });
    expect(save).toHaveBeenCalledTimes(3);
    expect(p.onSkip.mock.calls).toEqual([["unavailable"], ["too-large"]]);
  });
});
