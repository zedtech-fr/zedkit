# Live JSON fetch

Full Entry paths, traps, and Touches for the index rows that point here. The index in `.agents/atlas.md` stays a pointer; fix facts here and keep that row in sync.

## Where

| Topic | Entry | Why it lives there / trap | Touches | Checked |
| --- | --- | --- | --- | --- |
| Live sources and JSON fetch | `packages/live/src/fetch-json.ts#fetchJson#export async function fetchJson` | One-shot `Result` GET lives in live (not core 1.x, not server backoff). Injectable `fetch`/`sleep`; never echo request headers. No `node:` imports. | `pnpm --filter @zedtech/zedkit-live test` | 2026-11-12 |
