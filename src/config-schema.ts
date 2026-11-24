import { buildJsonChannelConfigSchema } from "openclaw/plugin-sdk/channel-config-schema";

const secretRef = (source: string, pattern: string) => ({
  type: "object",
  properties: {
    source: { const: source },
    provider: { type: "string", pattern: "^[a-z][a-z0-9_-]{0,63}$" },
    id: { type: "string", pattern },
  },
  required: ["source", "provider", "id"],
  additionalProperties: false,
});

const accountProperties = {
  name: { type: "string" },
  enabled: { type: "boolean" },
  botToken: {
    anyOf: [
      { type: "string" },
      secretRef("env", "^[A-Z][A-Z0-9_]{0,127}$"),
      secretRef("store", "^[A-Z][A-Z0-9_]{0,127}$"),
      secretRef("file", "^(?:value|/(?:[^~]|~[01])*)$"),
      secretRef("exec", "^(?!.*(?:^|/)\\.{1,2}(?:/|$))[A-Za-z0-9][A-Za-z0-9._:/#-]{0,255}$"),
    ],
  },
  tokenFile: { type: "string" },
  apiBaseUrl: { type: "string", format: "uri" },
  pollTime: { type: "integer", minimum: 1, maximum: 120 },
  dmPolicy: { type: "string", enum: ["pairing", "allowlist", "open", "disabled"] },
  allowFrom: { type: "array", items: { type: ["string", "number"] } },
  responsePrefix: { type: "string" },
};

export const VkTeamsConfigSchema = buildJsonChannelConfigSchema({
  type: "object",
  properties: {
    ...accountProperties,
    accounts: {
      type: "object",
      additionalProperties: {
        type: "object",
        properties: accountProperties,
        additionalProperties: false,
      },
    },
    defaultAccount: { type: "string" },
  },
  additionalProperties: false,
}, {
  uiHints: {
    botToken: { label: "VK Teams bot token", sensitive: true },
    "accounts.*.botToken": { label: "VK Teams bot token", sensitive: true },
  },
});
