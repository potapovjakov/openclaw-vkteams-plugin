import { DEFAULT_ACCOUNT_ID, normalizeAccountId } from "openclaw/plugin-sdk/account-id";
import { tryReadSecretFileSync } from "openclaw/plugin-sdk/secret-file";
import { normalizeResolvedSecretInputString, normalizeSecretInputString } from "./secret-input.js";
function readTokenFromFile(tokenFile) {
    return tryReadSecretFileSync(tokenFile, "VK Teams token file", { rejectSymlink: true }) ?? "";
}
function getAccountConfig(config, accountId) {
    return config?.accounts?.[normalizeAccountId(accountId)];
}
export function resolveVkTeamsToken(config, accountId, options) {
    const resolvedAccountId = normalizeAccountId(accountId);
    const isDefaultAccount = resolvedAccountId === DEFAULT_ACCOUNT_ID;
    const baseConfig = config;
    const accountConfig = getAccountConfig(baseConfig, resolvedAccountId);
    const accountHasBotToken = Boolean(accountConfig) && Object.prototype.hasOwnProperty.call(accountConfig, "botToken");
    if (accountConfig && accountHasBotToken) {
        const token = options?.allowUnresolvedSecretRef
            ? normalizeSecretInputString(accountConfig.botToken)
            : normalizeResolvedSecretInputString({
                value: accountConfig.botToken,
                path: `channels.vkteams.accounts.${resolvedAccountId}.botToken`,
            });
        if (token) {
            return { token, source: "config" };
        }
        const fileToken = readTokenFromFile(accountConfig.tokenFile);
        if (fileToken) {
            return { token: fileToken, source: "configFile" };
        }
    }
    if (!accountHasBotToken) {
        const fileToken = readTokenFromFile(accountConfig?.tokenFile);
        if (fileToken) {
            return { token: fileToken, source: "configFile" };
        }
    }
    if (!accountHasBotToken) {
        const token = options?.allowUnresolvedSecretRef
            ? normalizeSecretInputString(baseConfig?.botToken)
            : normalizeResolvedSecretInputString({
                value: baseConfig?.botToken,
                path: "channels.vkteams.botToken",
            });
        if (token) {
            return { token, source: "config" };
        }
        const fileToken = readTokenFromFile(baseConfig?.tokenFile);
        if (fileToken) {
            return { token: fileToken, source: "configFile" };
        }
    }
    if (isDefaultAccount) {
        const envToken = process.env.VKTEAMS_BOT_TOKEN?.trim();
        if (envToken) {
            return { token: envToken, source: "env" };
        }
    }
    return { token: "", source: "none" };
}
//# sourceMappingURL=token.js.map