import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/account-id";
import { resolveVkTeamsToken } from "./token.js";
import type { VkTeamsConfig } from "./types.js";

const originalEnvToken = process.env.VKTEAMS_BOT_TOKEN;
const tempDirs: string[] = [];

function writeTokenFile(name: string, value: string): string {
  const dir = mkdtempSync(join(tmpdir(), "openclaw-vkteams-token-test-"));
  tempDirs.push(dir);
  const path = join(dir, name);
  writeFileSync(path, `${value}\n`, "utf8");
  return path;
}

afterEach(() => {
  if (originalEnvToken === undefined) {
    delete process.env.VKTEAMS_BOT_TOKEN;
  } else {
    process.env.VKTEAMS_BOT_TOKEN = originalEnvToken;
  }
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("resolveVkTeamsToken", () => {
  it("prefers default-account config over base config and env", () => {
    process.env.VKTEAMS_BOT_TOKEN = "env-token";
    const config: VkTeamsConfig = {
      botToken: "base-token",
      accounts: {
        [DEFAULT_ACCOUNT_ID]: {
          botToken: "account-token",
        },
      },
    };

    expect(resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID)).toEqual({
      token: "account-token",
      source: "config",
    });
  });

  it("prefers default-account tokenFile over base config and env when no account botToken is present", () => {
    process.env.VKTEAMS_BOT_TOKEN = "env-token";
    const accountTokenFile = writeTokenFile("account-token.txt", "account-file-token");
    const config: VkTeamsConfig = {
      botToken: "base-token",
      tokenFile: writeTokenFile("base-token.txt", "base-file-token"),
      accounts: {
        [DEFAULT_ACCOUNT_ID]: {
          tokenFile: accountTokenFile,
        },
      },
    };

    expect(resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID)).toEqual({
      token: "account-file-token",
      source: "configFile",
    });
  });

  it("falls back from base config to base tokenFile to env for the default account", () => {
    process.env.VKTEAMS_BOT_TOKEN = "env-token";

    expect(resolveVkTeamsToken({ botToken: "base-token" }, DEFAULT_ACCOUNT_ID)).toEqual({
      token: "base-token",
      source: "config",
    });

    expect(
      resolveVkTeamsToken(
        {
          tokenFile: writeTokenFile("base-token.txt", "base-file-token"),
        },
        DEFAULT_ACCOUNT_ID,
      ),
    ).toEqual({
      token: "base-file-token",
      source: "configFile",
    });

    expect(resolveVkTeamsToken({}, DEFAULT_ACCOUNT_ID)).toEqual({
      token: "env-token",
      source: "env",
    });
  });

  it("prefers non-default account config over base config and ignores env fallback", () => {
    process.env.VKTEAMS_BOT_TOKEN = "env-token";
    const config: VkTeamsConfig = {
      botToken: "base-token",
      accounts: {
        team: {
          botToken: "account-token",
        },
      },
    };

    expect(resolveVkTeamsToken(config, "team")).toEqual({
      token: "account-token",
      source: "config",
    });

    expect(resolveVkTeamsToken(undefined, "team")).toEqual({
      token: "",
      source: "none",
    });
  });

  it("prefers non-default account tokenFile over base config and tokenFile", () => {
    process.env.VKTEAMS_BOT_TOKEN = "env-token";
    const config: VkTeamsConfig = {
      botToken: "base-token",
      tokenFile: writeTokenFile("base-token.txt", "base-file-token"),
      accounts: {
        team: {
          tokenFile: writeTokenFile("team-token.txt", "team-file-token"),
        },
      },
    };

    expect(resolveVkTeamsToken(config, "team")).toEqual({
      token: "team-file-token",
      source: "configFile",
    });
  });

  it("preserves unresolved env-template strings only when explicitly allowed", () => {
    const config: VkTeamsConfig = {
      botToken: "${VK_CONFIG_TOKEN}",
    };

    expect(resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID, { allowUnresolvedSecretRef: true })).toEqual({
      token: "${VK_CONFIG_TOKEN}",
      source: "config",
    });

    expect(resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID)).toEqual({
      token: "${VK_CONFIG_TOKEN}",
      source: "config",
    });
  });

  it("fails closed on unresolved SecretRef objects unless they are resolved elsewhere", () => {
    const config: VkTeamsConfig = {
      botToken: {
        source: "env",
        provider: "default",
        id: "VK_CONFIG_TOKEN",
      },
    };

    expect(resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID, { allowUnresolvedSecretRef: true })).toEqual({
      token: "",
      source: "none",
    });

    expect(() => resolveVkTeamsToken(config, DEFAULT_ACCOUNT_ID)).toThrow(
      'channels.vkteams.botToken: unresolved SecretRef "env:default:VK_CONFIG_TOKEN"',
    );
  });
});
