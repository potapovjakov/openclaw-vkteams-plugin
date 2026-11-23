import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
import { vkTeamsPlugin } from "./src/channel.js";
import { setVkTeamsRuntime } from "./src/runtime.js";

export { vkTeamsPlugin } from "./src/channel.js";
export { vkPlugin } from "./src/channel.js";
export { setVkTeamsRuntime } from "./src/runtime.js";

export default defineChannelPluginEntry({
  id: "vkteams",
  name: "VK Teams",
  description: "VK Teams Bot API channel plugin",
  plugin: vkTeamsPlugin,
  setRuntime: setVkTeamsRuntime,
});
