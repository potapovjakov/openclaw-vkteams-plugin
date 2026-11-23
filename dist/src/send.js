import { resolveVkTeamsAccount } from "./accounts.js";
import { sendVkTeamsText as apiSend } from "./api.js";
export async function sendVkTeamsText(chatId, text, o = {}) { const a = o.cfg ? resolveVkTeamsAccount({ cfg: o.cfg, accountId: o.accountId }) : undefined; const token = o.token ?? a?.token ?? ""; if (!token)
    return { ok: false, error: "No VK Teams bot token configured" }; try {
    const r = await apiSend({ apiBaseUrl: a?.config.apiBaseUrl ?? "https://api.armgs.team/bot/v1", token, chatId, text });
    return { ok: true, messageId: r.msgId };
}
catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
} }
//# sourceMappingURL=send.js.map