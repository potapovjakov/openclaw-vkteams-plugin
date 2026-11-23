import {
  createAccountListHelpers,
  resolveMergedAccountConfig,
} from "openclaw/plugin-sdk/account-helpers";
import { normalizeAccountId } from "openclaw/plugin-sdk/account-id";
import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
import { resolveVkTeamsToken } from "./token.js";
import type { ResolvedVkTeamsAccount, VkTeamsAccountConfig, VkTeamsConfig } from "./types.js";

export type { ResolvedVkTeamsAccount };

const { listAccountIds: listVkTeamsAccountIds, resolveDefaultAccountId: resolveDefaultVkAccountId } =
  createAccountListHelpers("vkteams");

export { listVkTeamsAccountIds, resolveDefaultVkAccountId };

function mergeVkTeamsAccountConfig(cfg: OpenClawConfig, accountId: string): VkTeamsAccountConfig {
  return resolveMergedAccountConfig<VkTeamsAccountConfig>({
    channelConfig: cfg.channels?.vkteams as VkTeamsAccountConfig | undefined,
    accounts: (cfg.channels?.vkteams as VkTeamsConfig | undefined)?.accounts as
      | Record<string, Partial<VkTeamsAccountConfig>>
      | undefined,
    accountId,
    omitKeys: ["defaultAccount"],
  });
}

export function resolveVkTeamsAccount(params: {
  cfg: OpenClawConfig;
  accountId?: string | null;
  allowUnresolvedSecretRef?: boolean;
}): ResolvedVkTeamsAccount {
  const accountId = normalizeAccountId(params.accountId);
  const baseEnabled = (params.cfg.channels?.vkteams as VkTeamsConfig | undefined)?.enabled !== false;
  const merged = mergeVkTeamsAccountConfig(params.cfg, accountId);
  const accountEnabled = merged.enabled !== false;
  const enabled = baseEnabled && accountEnabled;
  const tokenResolution = resolveVkTeamsToken(params.cfg.channels?.vkteams as VkTeamsConfig | undefined, accountId, {
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
