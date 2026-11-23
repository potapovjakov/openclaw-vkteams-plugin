export class VkTeamsApiError extends Error {
    constructor(message) { super(`VK Teams API error: ${message}`); this.name = "VkTeamsApiError"; }
}
export function normalizeApiBaseUrl(value) { return (value?.trim() || "https://api.armgs.team/bot/v1").replace(/\/$/, ""); }
async function requestJson(p) {
    const url = new URL(`${normalizeApiBaseUrl(p.apiBaseUrl)}/${p.method}`);
    if (url.protocol !== "https:")
        throw new VkTeamsApiError("API URL must use HTTPS");
    url.searchParams.set("token", p.token);
    for (const [k, v] of Object.entries(p.query ?? {}))
        if (v !== undefined)
            url.searchParams.set(k, String(v));
    const response = await fetch(url, { signal: p.signal, redirect: "manual" }).catch(() => {
        throw new VkTeamsApiError("network request failed");
    });
    if (!response.ok)
        throw new VkTeamsApiError(`HTTP ${String(response.status)}`);
    const body = (await response.json().catch(() => {
        throw new VkTeamsApiError("invalid JSON response");
    }));
    if (body.ok === false)
        throw new VkTeamsApiError("request failed");
    return body;
}
export async function getVkTeamsSelf(p) { return await requestJson({ ...p, method: "self/get" }); }
export async function getVkTeamsEvents(p) { return await requestJson({ ...p, method: "events/get", query: { lastEventId: p.lastEventId, pollTime: p.pollTime } }); }
export async function getVkTeamsFileInfo(p) { return await requestJson({ ...p, method: "files/getInfo", query: { fileId: p.fileId } }); }
export async function sendVkTeamsAction(p) { await requestJson({ ...p, method: "chats/sendActions", query: { chatId: p.chatId, actions: p.action } }); }
export async function sendVkTeamsText(p) { return await requestJson({ ...p, method: "messages/sendText", query: { chatId: p.chatId, text: p.text } }); }
//# sourceMappingURL=api.js.map