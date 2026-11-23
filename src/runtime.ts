import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
import type { PluginRuntime } from "openclaw/plugin-sdk/core";

const { setRuntime: setVkTeamsRuntime, getRuntime: getVkTeamsRuntime } =
  createPluginRuntimeStore<PluginRuntime>("VK runtime not initialized");

export { getVkTeamsRuntime, setVkTeamsRuntime };
