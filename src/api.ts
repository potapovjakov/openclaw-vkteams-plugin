export type VkTeamsBotInfo = { userId?: string; nick?: string; firstName?: string; about?: string };
export type VkTeamsFilePart = {
  type?: "sticker" | "mention" | "voice" | "file" | "forward" | "reply";
  payload?: {
    fileId?: string;
    type?: "image" | "audio" | "video";
    caption?: string;
    format?: string;
  };
};
export type VkTeamsEventPayload = {
  msgId?: string;
  chat?: { chatId?: string; type?: string; title?: string };
  from?: { userId?: string; firstName?: string; lastName?: string };
  text?: string;
  timestamp?: number;
  parts?: VkTeamsFilePart[];
};
export type VkTeamsEvent = { eventId: number; type: string; payload?: VkTeamsEventPayload };
export type VkTeamsEventsResponse = { events?: VkTeamsEvent[] };
export type VkTeamsFileInfo = { type?: string; size?: number; filename?: string; url?: string };
export class VkTeamsApiError extends Error { constructor(message: string) { super(`VK Teams API error: ${message}`); this.name = "VkTeamsApiError"; } }
export function normalizeApiBaseUrl(value?: string): string { return (value?.trim() || "https://api.armgs.team/bot/v1").replace(/\/$/, ""); }
async function requestJson<T>(p: { apiBaseUrl: string; token: string; method: string; query?: Record<string, string | number | undefined>; signal?: AbortSignal }): Promise<T> {
  const url = new URL(`${normalizeApiBaseUrl(p.apiBaseUrl)}/${p.method}`);
  if (url.protocol !== "https:") throw new VkTeamsApiError("API URL must use HTTPS");
  url.searchParams.set("token", p.token);
  for (const [k, v] of Object.entries(p.query ?? {})) if (v !== undefined) url.searchParams.set(k, String(v));
  const response = await fetch(url, { signal: p.signal, redirect: "manual" }).catch(() => {
    throw new VkTeamsApiError("network request failed");
  });
  if (!response.ok) throw new VkTeamsApiError(`HTTP ${String(response.status)}`);
  const body = (await response.json().catch(() => {
    throw new VkTeamsApiError("invalid JSON response");
  })) as T & { ok?: boolean };
  if (body.ok === false) throw new VkTeamsApiError("request failed");
  return body;
}
export async function getVkTeamsSelf(p: { apiBaseUrl: string; token: string; signal?: AbortSignal }): Promise<VkTeamsBotInfo> { return await requestJson({ ...p, method: "self/get" }); }
export async function getVkTeamsEvents(p: { apiBaseUrl: string; token: string; lastEventId: number; pollTime: number; signal?: AbortSignal }): Promise<VkTeamsEventsResponse> { return await requestJson({ ...p, method: "events/get", query: { lastEventId: p.lastEventId, pollTime: p.pollTime } }); }
export async function getVkTeamsFileInfo(p: { apiBaseUrl: string; token: string; fileId: string; signal?: AbortSignal }): Promise<VkTeamsFileInfo> { return await requestJson({ ...p, method: "files/getInfo", query: { fileId: p.fileId } }); }
export async function sendVkTeamsAction(p: { apiBaseUrl: string; token: string; chatId: string; action: "looking" | "typing"; signal?: AbortSignal }): Promise<void> { await requestJson({ ...p, method: "chats/sendActions", query: { chatId: p.chatId, actions: p.action } }); }
export async function sendVkTeamsText(p: { apiBaseUrl: string; token: string; chatId: string; text: string }): Promise<{ msgId?: string }> { return await requestJson({ ...p, method: "messages/sendText", query: { chatId: p.chatId, text: p.text } }); }
