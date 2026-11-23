import { createPatchedAccountSetupAdapter, DEFAULT_ACCOUNT_ID } from "openclaw/plugin-sdk/setup";
export const vkSetupAdapter = createPatchedAccountSetupAdapter({
    channelKey: "vkteams",
    validateInput: ({ accountId, input }) => {
        if (input.useEnv && accountId !== DEFAULT_ACCOUNT_ID) {
            return "VKTEAMS_BOT_TOKEN can only be used for the default account.";
        }
        if (!input.useEnv && !input.token && !input.tokenFile) {
            return "VK requires token or --token-file (or --use-env).";
        }
        return null;
    },
    buildPatch: (input) => input.useEnv
        ? {}
        : input.tokenFile
            ? { tokenFile: input.tokenFile }
            : input.token
                ? { botToken: input.token }
                : {},
});
//# sourceMappingURL=setup-core.js.map