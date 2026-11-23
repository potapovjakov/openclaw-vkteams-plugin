import { createAccountListHelpers, resolveMergedAccountConfig, } from "openclaw/plugin-sdk/account-helpers";
import { normalizeAccountId } from "openclaw/plugin-sdk/account-id";
import { resolveVkTeamsToken } from "./token.js";
const { listAccountIds: listVkTeamsAccountIds, resolveDefaultAccountId: resolveDefaultVkAccountId } = createAccountListHelpers("vkteams");
export { listVkTeamsAccountIds, resolveDefaultVkAccountId };
function mergeVkTeamsAccountConfig(cfg, accountId) {
    return resolveMergedAccountConfig({
        channelConfig: cfg.channels?.vkteams,
        accounts: cfg.channels?.vkteams?.accounts,
        accountId,
        omitKeys: ["defaultAccount"],
    });
}
export function resolveVkTeamsAccount(params) {
    const accountId = normalizeAccountId(params.accountId);
    const baseEnabled = params.cfg.channels?.vkteams?.enabled !== false;
    const merged = mergeVkTeamsAccountConfig(params.cfg, accountId);
    const accountEnabled = merged.enabled !== false;
    const enabled = baseEnabled && accountEnabled;
    const tokenResolution = resolveVkTeamsToken(params.cfg.channels?.vkteams, accountId, {
        allowUnresolvedSecretRef: params.allowUnresolvedSecretRef,
    });
    return {
        accountId,
        name: merged.name?.trim() || undefined,
        enabled,
        token: tokenResolution.token,
        tokenSource: tokenResolution.source,
        config: merged,
    };
}
//# sourceMappingURL=accounts.js.map