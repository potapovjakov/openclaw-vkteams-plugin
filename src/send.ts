import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import { stripMarkdown } from "openclaw/plugin-sdk/text-chunking";
import { resolveVkTeamsAccount } from "./accounts.js";
import { normalizeApiBaseUrl, sendVkTeamsText as apiSend } from "./api.js";
import type { ResolvedVkTeamsAccount } from "./types.js";

export async function sendVkTeamsText(
  chatId: string,
  text: string,
  options: { account: ResolvedVkTeamsAccount } | { cfg: OpenClawConfig; accountId?: string; token?: string },
) {
  const account = "account" in options ? options.account : resolveVkTeamsAccount(options);
  const token = "account" in options ? account.token : options.token ?? account.token;
  if (!token) return { ok: false, error: "No VK Teams bot token configured" };
  try {
    const plainText = stripMarkdown(text, { mode: "plain-text" });
    if (!plainText.trim()) return { ok: false, error: "No VK Teams message text to send" };
    const result = await apiSend({ apiBaseUrl: normalizeApiBaseUrl(account.config.apiBaseUrl), token, chatId, text: plainText });
    return { ok: true, messageId: result.msgId };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
