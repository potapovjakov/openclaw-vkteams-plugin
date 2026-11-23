import { sendVkTeamsAction } from "./api.js";

const REFRESH_MS = 4_000;

export async function withVkTeamsTyping<T>(
  options: { apiBaseUrl: string; token: string; chatId: string; signal: AbortSignal; onError?: () => void },
  run: () => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  const signal = AbortSignal.any([options.signal, controller.signal]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = () => {
    controller.abort();
    clearTimeout(timer);
  };
  const refresh = async () => {
    if (signal.aborted) return;
    try {
      await sendVkTeamsAction({ ...options, action: "typing", signal: AbortSignal.any([signal, AbortSignal.timeout(REFRESH_MS)]) });
    } catch {
      if (!signal.aborted) options.onError?.();
      return; // Typing is best effort; don't retry a failing endpoint on this turn.
    }
    if (!signal.aborted) timer = setTimeout(() => void refresh(), REFRESH_MS);
  };

  options.signal.addEventListener("abort", stop, { once: true });
  try {
    void refresh();
    return await run();
  } finally {
    stop();
    options.signal.removeEventListener("abort", stop);
  }
}
