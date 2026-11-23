import {
  createStandardChannelSetupStatus,
  createTopLevelChannelDmPolicy,
  DEFAULT_ACCOUNT_ID,
  formatDocsLink,
  hasConfiguredSecretInput,
  mergeAllowFromEntries,
  normalizeAccountId,
  runSingleChannelSecretStep,
  type ChannelSetupDmPolicy,
  type ChannelSetupWizard,
  type OpenClawConfig,
  type SecretInput,
} from "openclaw/plugin-sdk/setup";
import { listVkTeamsAccountIds, resolveDefaultVkAccountId, resolveVkTeamsAccount } from "./accounts.js";
import { vkSetupAdapter } from "./setup-core.js";

const channel = "vkteams" as const;

async function noteVkTokenHelp(
  prompter: Parameters<NonNullable<ChannelSetupWizard["finalize"]>>[0]["prompter"],
): Promise<void> {
  await prompter.note(
    [
      "1) Open your VK Teams settings and enable Long Poll API",
      "2) Create a community access token with messages permissions",
      "3) Paste the group token here or set VKTEAMS_BOT_TOKEN",
      `Docs: ${formatDocsLink("/plugins/community", "community plugins")}`,
    ].join("\n"),
    "VK Teams token",
  );
}

async function promptVkAllowFrom(params: {
  cfg: OpenClawConfig;
  prompter: Parameters<NonNullable<ChannelSetupDmPolicy["promptAllowFrom"]>>[0]["prompter"];
  accountId: string;
}): Promise<OpenClawConfig> {
  const { cfg, prompter, accountId } = params;
  const resolved = resolveVkTeamsAccount({ cfg, accountId });
  const existingAllowFrom = resolved.config.allowFrom ?? [];
  const entry = await prompter.text({
    message: "VK allowFrom (user id)",
    placeholder: "123456789",
    initialValue: existingAllowFrom[0] ? String(existingAllowFrom[0]) : undefined,
    validate: (value) => {
      const raw = String(value ?? "").trim().replace(/^vkteams:/i, "");
      if (!raw) {
        return "Required";
      }
      if (!/^\d+$/.test(raw)) {
        return "Use a numeric VK user id";
      }
      return undefined;
    },
  });
  const normalized = String(entry).trim().replace(/^vkteams:/i, "");
  const unique = mergeAllowFromEntries(existingAllowFrom, [normalized]);

  if (accountId === DEFAULT_ACCOUNT_ID) {
    return {
      ...cfg,
      channels: {
        ...cfg.channels,
        vkteams: {
          ...cfg.channels?.vkteams,
          enabled: true,
          dmPolicy: "allowlist",
          allowFrom: unique,
        },
      },
    } as OpenClawConfig;
  }

  return {
    ...cfg,
    channels: {
      ...cfg.channels,
      vkteams: {
        ...cfg.channels?.vkteams,
        enabled: true,
        accounts: {
          ...cfg.channels?.vkteams?.accounts,
          [accountId]: {
            ...cfg.channels?.vkteams?.accounts?.[accountId],
            enabled: cfg.channels?.vkteams?.accounts?.[accountId]?.enabled ?? true,
            dmPolicy: "allowlist",
            allowFrom: unique,
          },
        },
      },
    },
  } as OpenClawConfig;
}

const vkDmPolicy: ChannelSetupDmPolicy = createTopLevelChannelDmPolicy({
  label: "VK",
  channel,
  policyKey: "channels.vkteams.dmPolicy",
  allowFromKey: "channels.vkteams.allowFrom",
  getCurrent: (cfg) => cfg.channels?.vkteams?.dmPolicy ?? "pairing",
  promptAllowFrom: async ({ cfg, prompter, accountId }) => {
    const id =
      accountId && normalizeAccountId(accountId)
        ? (normalizeAccountId(accountId) ?? DEFAULT_ACCOUNT_ID)
        : resolveDefaultVkAccountId(cfg as OpenClawConfig);
    return await promptVkAllowFrom({
      cfg: cfg as OpenClawConfig,
      prompter,
      accountId: id,
    });
  },
});

export { vkSetupAdapter } from "./setup-core.js";

export const vkSetupWizard: ChannelSetupWizard = {
  channel,
  status: createStandardChannelSetupStatus({
    channelLabel: "VK",
    configuredLabel: "configured",
    unconfiguredLabel: "needs token",
    configuredHint: "configured",
    unconfiguredHint: "needs group token",
    configuredScore: 1,
    unconfiguredScore: 10,
    includeStatusLine: true,
    resolveConfigured: ({ cfg }) =>
      listVkTeamsAccountIds(cfg).some((accountId) => {
        const account = resolveVkTeamsAccount({
          cfg,
          accountId,
          allowUnresolvedSecretRef: true,
        });
        return (
          Boolean(account.token) ||
          hasConfiguredSecretInput(account.config.botToken) ||
          Boolean(account.config.tokenFile?.trim())
        );
      }),
  }),
  credentials: [],
  finalize: async ({ cfg, accountId, forceAllowFrom, options, prompter }) => {
    const resolvedAccount = resolveVkTeamsAccount({
      cfg,
      accountId,
      allowUnresolvedSecretRef: true,
    });
    const accountConfigured = Boolean(resolvedAccount.token);
    const allowEnv = accountId === DEFAULT_ACCOUNT_ID;
    const hasConfigToken = Boolean(
      hasConfiguredSecretInput(resolvedAccount.config.botToken) || resolvedAccount.config.tokenFile,
    );
    const tokenStep = await runSingleChannelSecretStep({
      cfg,
      prompter,
      providerHint: "vkteams",
      credentialLabel: "group token",
      secretInputMode: options?.secretInputMode,
      accountConfigured,
      hasConfigToken,
      allowEnv,
      envValue: process.env.VKTEAMS_BOT_TOKEN,
      envPrompt: "VKTEAMS_BOT_TOKEN detected. Use env var?",
      keepPrompt: "VK Teams token already configured. Keep it?",
      inputPrompt: "Enter VK Teams token",
      preferredEnvVar: "VKTEAMS_BOT_TOKEN",
      onMissingConfigured: async () => await noteVkTokenHelp(prompter),
      applyUseEnv: async (currentCfg) =>
        accountId === DEFAULT_ACCOUNT_ID
          ? ({
              ...currentCfg,
              channels: {
                ...currentCfg.channels,
                vkteams: {
                  ...currentCfg.channels?.vkteams,
                  enabled: true,
                },
              },
            } as OpenClawConfig)
          : currentCfg,
      applySet: async (
        currentCfg: OpenClawConfig,
        value: SecretInput,
        resolvedValue: string,
      ) => {
        if (typeof value === "string") {
          return await vkSetupAdapter.applyAccountConfig({
            cfg: currentCfg,
            accountId,
            input: { token: resolvedValue },
          });
        }
        if (accountId === DEFAULT_ACCOUNT_ID) {
          return {
            ...currentCfg,
            channels: {
              ...currentCfg.channels,
              vkteams: {
                ...currentCfg.channels?.vkteams,
                enabled: true,
                botToken: value,
              },
            },
          } as OpenClawConfig;
        }
        return {
          ...currentCfg,
          channels: {
            ...currentCfg.channels,
            vkteams: {
              ...currentCfg.channels?.vkteams,
              enabled: true,
              accounts: {
                ...currentCfg.channels?.vkteams?.accounts,
                [accountId]: {
                  ...currentCfg.channels?.vkteams?.accounts?.[accountId],
                  enabled: currentCfg.channels?.vkteams?.accounts?.[accountId]?.enabled ?? true,
                  botToken: value,
                },
              },
            },
          },
        } as OpenClawConfig;
      },
    });

    let next = tokenStep.cfg;
    if (forceAllowFrom) {
      next = await promptVkAllowFrom({ cfg: next, prompter, accountId });
    }
    return { cfg: next };
  },
  dmPolicy: vkDmPolicy,
};
