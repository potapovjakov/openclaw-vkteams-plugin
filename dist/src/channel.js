import { describeAccountSnapshot } from "openclaw/plugin-sdk/account-helpers";
import { adaptScopedAccountAccessor, createScopedChannelConfigAdapter, createScopedDmSecurityResolver, } from "openclaw/plugin-sdk/channel-config-helpers";
import { createRawChannelSendResultAdapter } from "openclaw/plugin-sdk/channel-send-result";
import { createChatChannelPlugin } from "openclaw/plugin-sdk/core";
import { createChannelDirectoryAdapter, listResolvedDirectoryUserEntriesFromAllowFrom, } from "openclaw/plugin-sdk/directory-runtime";
import { buildTokenChannelStatusSummary, PAIRING_APPROVED_MESSAGE, } from "openclaw/plugin-sdk/channel-status";
import { createComputedAccountStatusAdapter, createDefaultChannelRuntimeState, } from "openclaw/plugin-sdk/status-helpers";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/setup";
import { listVkTeamsAccountIds, resolveDefaultVkAccountId, resolveVkTeamsAccount } from "./accounts.js";
import { startVkTeamsGatewayAccount, notifyVkTeamsPairingApproval, sendVkTeamsTextFromRuntime } from "./channel.runtime.js";
import { VkTeamsConfigSchema } from "./config-schema.js";
import { probeVkTeamsAccount } from "./probe.js";
import { resolveVkTeamsOutboundSessionRoute } from "./session-route.js";
import { vkSetupAdapter } from "./setup-core.js";
import { vkSetupWizard } from "./setup-surface.js";
function normalizeVkTeamsTarget(raw) {
    const trimmed = raw.trim();
    if (!trimmed) {
        return undefined;
    }
    return trimmed.replace(/^vkteams:/i, "").trim();
}
const vkConfigAdapter = createScopedChannelConfigAdapter({
    sectionKey: "vkteams",
    listAccountIds: listVkTeamsAccountIds,
    resolveAccount: adaptScopedAccountAccessor(resolveVkTeamsAccount),
    defaultAccountId: resolveDefaultVkAccountId,
    clearBaseFields: ["botToken", "tokenFile", "name"],
    resolveAllowFrom: (account) => account.config.allowFrom,
    formatAllowFrom: (allowFrom) => allowFrom
        .map((entry) => String(entry).trim().replace(/^vkteams:/i, ""))
        .filter(Boolean),
});
const resolveVkTeamsDmPolicy = createScopedDmSecurityResolver({
    channelKey: "vkteams",
    resolvePolicy: (account) => account.config.dmPolicy,
    resolveAllowFrom: (account) => account.config.allowFrom,
    policyPathSuffix: "dmPolicy",
    defaultPolicy: "pairing",
    normalizeEntry: (raw) => raw.trim().replace(/^vkteams:/i, ""),
});
const vkRawSendResultAdapter = createRawChannelSendResultAdapter({
    channel: "vkteams",
    sendText: async ({ to, text, accountId, cfg }) => await sendVkTeamsTextFromRuntime({
        to,
        text,
        accountId: accountId ?? undefined,
        cfg,
    }),
});
export const vkTeamsPlugin = createChatChannelPlugin({
    base: {
        id: "vkteams",
        meta: {
            id: "vkteams",
            label: "VK Teams",
            selectionLabel: "VK (Long Poll API)",
            detailLabel: "VK Teams plugin",
            docsPath: "/plugins/community",
            docsLabel: "Community plugins",
            blurb: "VK Teams bot via Long Poll API for direct-message routing.",
            order: 85,
            quickstartAllowFrom: true,
        },
        capabilities: {
            chatTypes: ["direct"],
            media: true,
            reactions: false,
            threads: false,
            polls: false,
            nativeCommands: false,
            blockStreaming: true,
        },
        reload: { configPrefixes: ["channels.vkteams"] },
        configSchema: VkTeamsConfigSchema,
        setup: vkSetupAdapter,
        setupWizard: vkSetupWizard,
        config: {
            ...vkConfigAdapter,
            isConfigured: (account) => Boolean(account.token.trim()),
            describeAccount: (account) => describeAccountSnapshot({
                account,
                configured: Boolean(account.token.trim()),
                extra: {
                    tokenSource: account.tokenSource,
                },
            }),
        },
        messaging: {
            normalizeTarget: normalizeVkTeamsTarget,
            resolveOutboundSessionRoute: (params) => resolveVkTeamsOutboundSessionRoute(params),
            targetResolver: {
                looksLikeId: (raw) => {
                    const trimmed = raw.trim().replace(/^vkteams:/i, "");
                    if (!trimmed) {
                        return false;
                    }
                    return /^(group:|chat:)?\d+$/i.test(trimmed);
                },
                hint: "<userId|group:peerId>",
            },
        },
        directory: createChannelDirectoryAdapter({
            listPeers: async (params) => await listResolvedDirectoryUserEntriesFromAllowFrom({
                ...params,
                resolveAccount: adaptScopedAccountAccessor(resolveVkTeamsAccount),
                resolveAllowFrom: (account) => account.config.allowFrom,
                normalizeId: (entry) => entry.trim().replace(/^vkteams:/i, ""),
            }),
            listGroups: async () => [],
        }),
        status: createComputedAccountStatusAdapter({
            defaultRuntime: createDefaultChannelRuntimeState(DEFAULT_ACCOUNT_ID),
            buildChannelSummary: ({ snapshot }) => buildTokenChannelStatusSummary(snapshot),
            probeAccount: async ({ account, timeoutMs }) => await probeVkTeamsAccount({ account, timeoutMs }),
            resolveAccountSnapshot: ({ account, runtime, probe }) => ({
                accountId: account.accountId,
                name: account.name,
                enabled: account.enabled,
                configured: Boolean(account.token.trim()),
                extra: {
                    tokenSource: account.tokenSource,
                    connected: runtime?.connected ?? false,
                    lastConnectedAt: runtime?.lastConnectedAt ?? null,
                    lastDisconnect: runtime?.lastDisconnect ?? null,
                    lastError: runtime?.lastError ?? null,
                    profile: probe && probe.ok ? probe.profile : runtime?.profile,
                },
            }),
        }),
        gateway: {
            startAccount: async (ctx) => await startVkTeamsGatewayAccount(ctx),
        },
    },
    security: {
        resolveDmPolicy: resolveVkTeamsDmPolicy,
    },
    pairing: {
        text: {
            idLabel: "vkUserId",
            message: PAIRING_APPROVED_MESSAGE,
            normalizeAllowEntry: (entry) => entry.trim().replace(/^vkteams:/i, ""),
            notify: async ({ cfg, id, accountId }) => await notifyVkTeamsPairingApproval({ cfg, id, accountId }),
        },
    },
    threading: {
        resolveReplyToMode: () => "off",
    },
    outbound: {
        deliveryMode: "direct",
        textChunkLimit: 4000,
        ...vkRawSendResultAdapter,
    },
});
export const vkPlugin = vkTeamsPlugin;
//# sourceMappingURL=channel.js.map