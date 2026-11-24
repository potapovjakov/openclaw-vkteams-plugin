import { saveRemoteMedia } from "openclaw/plugin-sdk/media-runtime";
import { getVkTeamsFileInfo } from "./api.js";
const MAX_ATTACHMENT_BYTES = 25 * 1024 * 1024;
const ATTACHMENT_TIMEOUT_MS = 30_000;
export function getVkTeamsAttachments(parts = []) {
    return parts.flatMap((part) => {
        if (part.type !== "file" && part.type !== "voice")
            return [];
        const fileId = part.payload?.fileId?.trim();
        if (!fileId)
            return [];
        const label = part.type === "voice" ? "[Голосовое сообщение]"
            : part.payload?.type === "image" ? "[Изображение]"
                : "[Файл]";
        return [{ fileId, caption: part.payload?.caption?.trim(), label }];
    });
}
export async function loadVkTeamsAttachments(p) {
    const mediaPaths = [];
    const mediaTypes = [];
    const captions = new Set();
    const labels = new Set();
    for (const { fileId, caption, label } of p.attachments) {
        if (p.signal.aborted)
            break;
        if (caption && caption !== p.text.trim())
            captions.add(caption);
        try {
            const signal = AbortSignal.any([p.signal, AbortSignal.timeout(ATTACHMENT_TIMEOUT_MS)]);
            const info = await getVkTeamsFileInfo({ apiBaseUrl: p.apiBaseUrl, token: p.token, fileId, signal });
            if (info.size !== undefined && info.size > MAX_ATTACHMENT_BYTES) {
                p.onSkip("too-large");
                continue;
            }
            if (!info.url) {
                p.onSkip("unavailable");
                continue;
            }
            // The API supplies the download URL; never send the bot token to the file host.
            const saved = await saveRemoteMedia({
                url: info.url,
                originalFilename: info.filename,
                filePathHint: info.filename,
                requireHttps: true,
                maxBytes: MAX_ATTACHMENT_BYTES,
                requestInit: { signal },
            });
            mediaPaths.push(saved.path);
            mediaTypes.push(saved.contentType ?? "application/octet-stream");
            labels.add(label);
        }
        catch {
            // SDK errors may contain a signed download URL. Do not forward or log them.
            if (!p.signal.aborted)
                p.onSkip("unavailable");
        }
    }
    const body = [p.text || [...labels].join(" "), ...captions].filter(Boolean).join("\n\n");
    return {
        body,
        context: mediaPaths.length ? {
            MediaPath: mediaPaths[0],
            MediaType: mediaTypes[0],
            MediaPaths: mediaPaths,
            MediaTypes: mediaTypes,
        } : undefined,
    };
}
//# sourceMappingURL=inbound-attachments.js.map