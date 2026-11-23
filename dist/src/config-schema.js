import { AllowFromListSchema, buildCatchallMultiAccountChannelSchema, DmPolicySchema, } from "openclaw/plugin-sdk/channel-config-schema";
import { z } from "zod";
import { buildSecretInputSchema } from "./secret-input.js";
const vkAccountSchema = z.object({
    name: z.string().optional(),
    enabled: z.boolean().optional(),
    botToken: buildSecretInputSchema().optional(),
    tokenFile: z.string().optional(),
    apiBaseUrl: z.url().optional(),
    pollTime: z.number().int().min(1).max(120).optional(),
    dmPolicy: DmPolicySchema.optional(),
    allowFrom: AllowFromListSchema,
    responsePrefix: z.string().optional(),
});
export const VkTeamsConfigSchema = buildCatchallMultiAccountChannelSchema(vkAccountSchema);
//# sourceMappingURL=config-schema.js.map