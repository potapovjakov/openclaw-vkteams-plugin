import { buildChannelOutboundSessionRoute, stripChannelTargetPrefix, stripTargetKindPrefix, } from "openclaw/plugin-sdk/core";
const VK_GROUP_CHAT_PEER_ID_MIN = 2_000_000_000;
function parseVkPeerTarget(raw) {
    const withoutProvider = stripChannelTargetPrefix(raw, "vkteams");
    if (!withoutProvider) {
        return null;
    }
    const normalized = withoutProvider.trim();
    if (!normalized) {
        return null;
    }
    const lower = normalized.toLowerCase();
    const explicitGroup = lower.startsWith("group:") || lower.startsWith("chat:");
    const peerId = stripTargetKindPrefix(normalized);
    if (!/^\d+$/.test(peerId)) {
        return null;
    }
    return {
        peerId,
        chatType: explicitGroup || Number(peerId) >= VK_GROUP_CHAT_PEER_ID_MIN ? "group" : "direct",
    };
}
export function resolveVkTeamsOutboundSessionRoute(params) {
    const parsed = parseVkPeerTarget(params.target);
    if (!parsed) {
        return null;
    }
    return buildChannelOutboundSessionRoute({
        cfg: params.cfg,
        agentId: params.agentId,
        channel: "vkteams",
        accountId: params.accountId,
        peer: {
            kind: parsed.chatType,
            id: parsed.peerId,
        },
        chatType: parsed.chatType,
        from: parsed.chatType === "group" ? `vkteams:group:${parsed.peerId}` : `vkteams:${parsed.peerId}`,
        to: `vkteams:${parsed.peerId}`,
    });
}
//# sourceMappingURL=session-route.js.map