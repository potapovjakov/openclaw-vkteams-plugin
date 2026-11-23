export class VkTeamsApiError extends Error {
    constructor(message) { super(`VK Teams API error: ${message}`); this.name = "VkTeamsApiError"; }
}
export function normalizeApiBaseUrl(value) { return (value?.trim() || "https://api.armgs.team/bot/v1").replace(/\/$/, ""); }
async function requestJson(p) {
    const url = new URL(`${normalizeApiBaseUrl(p.apiBaseUrl)}/${p.method}`);
    url.searchParams.set("token", p.token);
    for (const [k, v] of Object.entries(p.query ?? {}))
        if (v !== undefined)
            url.searchParams.set(k, String(v));
    const response = await fetch(url, { signal: p.signal });
    if (!response.ok)
        throw new VkTeamsApiError(`HTTP ${String(response.status)}`);
    const body = (await response.json());
    if (body.ok === false)
        throw new VkTeamsApiError(body.description ?? "request failed");
    return body;
}
export async function getVkTeamsSelf(p) { return await requestJson({ ...p, method: "self/get" }); }
export async function getVkTeamsEvents(p) { return await requestJson({ ...p, method: "events/get", query: { lastEventId: p.lastEventId, pollTime: p.pollTime } }); }
export async function sendVkTeamsText(p) { return await requestJson({ ...p, method: "messages/sendText", query: { chatId: p.chatId, text: p.text } }); }
//# sourceMappingURL=api.js.map