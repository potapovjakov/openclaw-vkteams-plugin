import { createAccountStatusSink } from "openclaw/plugin-sdk/channel-outbound";
import { resolveVkTeamsAccount } from "./accounts.js";
import { probeVkTeamsAccount } from "./probe.js";
import { getVkTeamsRuntime } from "./runtime.js";
import { sendVkTeamsText } from "./send.js";
export async function notifyVkTeamsPairingApproval(params) {
    const account = resolveVkTeamsAccount({ cfg: params.cfg, accountId: params.accountId });
    if (!account.token) {
        throw new Error("VK Teams token not configured");
    }
    const result = await sendVkTeamsText(params.id, "OpenClaw: your access has been approved.", { account });
    if (!result.ok)
        throw new Error(result.error);
}
export async function sendVkTeamsTextFromRuntime(params) {
    return await sendVkTeamsText(params.to, params.text, params);
}
export async function startVkTeamsGatewayAccount(ctx) {
    const account = ctx.account;
    const statusSink = createAccountStatusSink({
        accountId: ctx.accountId,
        setStatus: ctx.setStatus,
    });
    const probe = await probeVkTeamsAccount({ account, timeoutMs: 5000 });
    if (probe.ok) {
        statusSink({
            tokenSource: account.tokenSource,
            connected: true,
            lastConnectedAt: Date.now(),
            profile: probe.profile,
            lastError: null,
        });
    }
    else {
        statusSink({
            tokenSource: account.tokenSource,
            connected: false,
            lastError: probe.error,
        });
    }
    ctx.log?.info(`[${account.accountId}] starting provider${probe.ok && (probe.profile.nick || probe.profile.firstName) ? ` (${probe.profile.nick || probe.profile.firstName})` : ""}`);
    const { monitorVkTeamsProvider } = await import("./monitor.js");
    return await monitorVkTeamsProvider({
        account,
        config: ctx.cfg,
        token: account.token,
        runtime: getVkTeamsRuntime(),
        abortSignal: ctx.abortSignal,
        statusSink,
        log: ctx.log,
    });
}
//# sourceMappingURL=channel.runtime.js.map