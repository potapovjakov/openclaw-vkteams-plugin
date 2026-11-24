import { createChannelPairingController } from "openclaw/plugin-sdk/channel-pairing";
import { dispatchInboundDirectDm, resolveInboundDirectDmAccessWithRuntime } from "openclaw/plugin-sdk/channel-inbound";
import { getVkTeamsEvents, getVkTeamsSelf } from "./api.js";
import { getVkTeamsAttachments, loadVkTeamsAttachments } from "./inbound-attachments.js";
import { sendVkTeamsText } from "./send.js";
import { withVkTeamsTyping } from "./typing.js";
const allowed = (id, list = []) => list.some((x) => x.trim() === "*" || x.trim().replace(/^vkteams:/i, "") === id);
export async function monitorVkTeamsProvider(p) {
    const { token, account, config, runtime, abortSignal, statusSink, log } = p;
    const apiBaseUrl = account.config.apiBaseUrl ?? "https://api.armgs.team/bot/v1";
    const pairing = createChannelPairingController({ core: runtime, channel: "vkteams", accountId: account.accountId });
    const profile = await getVkTeamsSelf({ apiBaseUrl, token, signal: abortSignal });
    statusSink({ connected: true, lastConnectedAt: Date.now(), profile, lastError: null });
    let lastEventId = 0;
    while (!abortSignal.aborted) {
        try {
            const result = await getVkTeamsEvents({ apiBaseUrl, token, lastEventId, pollTime: account.config.pollTime ?? 60, signal: abortSignal });
            for (const event of result.events ?? []) {
                lastEventId = Math.max(lastEventId, Number(event.eventId) || 0);
                if (event.type !== "newMessage")
                    continue;
                const x = event.payload;
                const senderId = x?.from?.userId?.trim();
                const chatId = x?.chat?.chatId?.trim() || senderId;
                const text = x?.text ?? "";
                const attachments = getVkTeamsAttachments(x?.parts);
                if (!senderId || !chatId || (!text && attachments.length === 0))
                    continue;
                if (x?.chat?.type && x.chat.type !== "private") {
                    log?.debug?.(`[${account.accountId}] ignoring non-private message`);
                    continue;
                }
                statusSink({ lastInboundAt: Date.now(), lastError: null });
                const access = await resolveInboundDirectDmAccessWithRuntime({ cfg: config, channel: "vkteams", accountId: account.accountId, dmPolicy: account.config.dmPolicy ?? "pairing", allowFrom: account.config.allowFrom, senderId, rawBody: text || attachments[0]?.label || "", isSenderAllowed: allowed, runtime: { shouldComputeCommandAuthorized: runtime.channel.commands.shouldComputeCommandAuthorized, resolveCommandAuthorizedFromAuthorizers: runtime.channel.commands.resolveCommandAuthorizedFromAuthorizers }, modeWhenAccessGroupsOff: "configured" });
                if (access.access.decision === "pairing") {
                    await pairing.issueChallenge({ senderId, senderIdLine: `Your VK Teams user id: ${senderId}`, sendPairingReply: async (reply) => { const sent = await sendVkTeamsText(chatId, reply, { token, cfg: config, accountId: account.accountId }); if (!sent.ok)
                            throw new Error(sent.error); statusSink({ lastOutboundAt: Date.now() }); }, onCreated: () => log?.debug?.(`[${account.accountId}] pairing request sender=${senderId}`), onReplyError: (e) => log?.warn?.(`[${account.accountId}] pairing reply failed: ${String(e)}`) });
                    continue;
                }
                if (access.access.decision !== "allow")
                    continue;
                const { body: rawBody, context } = await loadVkTeamsAttachments({
                    attachments, text, apiBaseUrl, token, signal: abortSignal,
                    onSkip: (reason) => log?.warn?.(`[${account.accountId}] VK Teams attachment skipped: ${reason}`),
                });
                if (abortSignal.aborted || !rawBody)
                    continue;
                await withVkTeamsTyping({ apiBaseUrl, token, chatId, signal: abortSignal, onError: () => log?.debug?.(`[${account.accountId}] typing indicator update failed`) }, async () => await dispatchInboundDirectDm({
                    cfg: config,
                    channelRuntime: runtime.channel,
                    channel: "vkteams",
                    channelLabel: "VK Teams",
                    accountId: account.accountId,
                    peer: { kind: "direct", id: senderId },
                    senderId,
                    senderAddress: `vkteams:${senderId}`,
                    recipientAddress: `vkteams:${account.accountId}`,
                    conversationLabel: x?.from?.firstName || senderId,
                    rawBody,
                    messageId: x?.msgId || String(event.eventId),
                    timestamp: x?.timestamp ? x.timestamp * 1000 : Date.now(),
                    commandAuthorized: access.commandAuthorized,
                    extraContext: context,
                    deliver: async (reply) => {
                        const out = reply && typeof reply === "object" && "text" in reply ? String(reply.text ?? "") : "";
                        if (!out.trim())
                            return;
                        const sent = await sendVkTeamsText(chatId, out, { token, cfg: config, accountId: account.accountId });
                        if (!sent.ok)
                            throw new Error(sent.error);
                        statusSink({ lastOutboundAt: Date.now() });
                    },
                    onRecordError: (e) => log?.error?.(`[${account.accountId}] inbound record failed: ${String(e)}`),
                    onDispatchError: (e, info) => log?.error?.(`[${account.accountId}] ${info.kind} dispatch failed: ${String(e)}`),
                }));
            }
        }
        catch (e) {
            if (abortSignal.aborted)
                break;
            const message = e instanceof Error ? e.message : String(e);
            statusSink({ connected: false, lastDisconnect: { at: Date.now(), error: message }, lastError: message });
            log?.warn?.(`[${account.accountId}] polling error: ${message}; retrying`);
            await new Promise((r) => { const t = setTimeout(r, 5000); abortSignal.addEventListener("abort", () => { clearTimeout(t); r(); }, { once: true }); });
            if (!abortSignal.aborted)
                statusSink({ connected: true, lastConnectedAt: Date.now(), lastError: null });
        }
    }
}
//# sourceMappingURL=monitor.js.map