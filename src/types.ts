import type { SecretInput } from "openclaw/plugin-sdk/setup";
export type VkTeamsAccountConfig = { name?: string; enabled?: boolean; botToken?: SecretInput; tokenFile?: string; apiBaseUrl?: string; pollTime?: number; dmPolicy?: "pairing" | "allowlist" | "open" | "disabled"; allowFrom?: string[] };
export type VkTeamsConfig = VkTeamsAccountConfig & { accounts?: Record<string, Partial<VkTeamsAccountConfig>>; defaultAccount?: string };
export type ResolvedVkTeamsAccount = { accountId: string; name?: string; enabled: boolean; token: string; tokenSource: "env" | "config" | "configFile" | "none"; config: VkTeamsAccountConfig };
export type VkTeamsProbeResult = { ok: true; profile: VkTeamsBotInfo } | { ok: false; error: string };
type VkTeamsBotInfo = { userId?: string; nick?: string; firstName?: string };
