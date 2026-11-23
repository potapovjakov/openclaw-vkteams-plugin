import { getVkTeamsSelf } from "./api.js";
export async function probeVkTeamsAccount(p) { const c = new AbortController(); const timer = setTimeout(() => c.abort(), p.timeoutMs ?? 5000); try {
    const profile = await getVkTeamsSelf({ apiBaseUrl: p.account.config.apiBaseUrl ?? "https://api.armgs.team/bot/v1", token: p.account.token, signal: c.signal });
    return { ok: true, profile };
}
catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
}
finally {
    clearTimeout(timer);
    c.abort();
} }
//# sourceMappingURL=probe.js.map