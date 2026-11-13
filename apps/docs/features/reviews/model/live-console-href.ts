/** In-site public live console. Path-safe run ids only; never a `t=` token. */

export const LIVE_CONSOLE_PATH = "/issues/run";
export const LIVE_CONSOLE_ITEM_MAX = 80;
export const LIVE_CONSOLE_RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/;
export const LIVE_CONSOLE_ITEM_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,79}$/;

const APPEARANCE_KEYS = new Set(["identity", "preview", "theme", "density"]);

export type LiveConsoleLocation = {
  readonly runId: string | null;
  readonly itemId: string | null;
  readonly reason: "ok" | "missing-id" | "invalid-id";
};

export function sanitizeLiveConsoleRunId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (!LIVE_CONSOLE_RUN_ID_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function sanitizeLiveConsoleItemId(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > LIVE_CONSOLE_ITEM_MAX) return null;
  if (!LIVE_CONSOLE_ITEM_PATTERN.test(trimmed)) return null;
  return trimmed;
}

export function toLiveConsoleHref(runId: string, itemId?: string | null): string {
  const params = new URLSearchParams();
  params.set("id", runId);
  const item = sanitizeLiveConsoleItemId(itemId);
  if (item !== null) params.set("item", item);
  return `${LIVE_CONSOLE_PATH}?${params.toString()}`;
}

function hashItemId(hash: string): string | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (raw === "") return null;
  if (raw.startsWith("item=")) {
    return sanitizeLiveConsoleItemId(raw.slice("item=".length).split("&", 1)[0] ?? "");
  }
  const params = new URLSearchParams(raw);
  return sanitizeLiveConsoleItemId(params.get("item"));
}

export function parseLiveConsoleLocation(
  search: string,
  hash = "",
  pathRunId?: string | null,
): LiveConsoleLocation {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const fromPath = sanitizeLiveConsoleRunId(pathRunId);
  const fromQuery = sanitizeLiveConsoleRunId(params.get("id"));
  const rawId = pathRunId ?? params.get("id");
  const runId = fromPath ?? fromQuery;
  if (runId === null) {
    const missing = rawId === null || rawId === undefined || rawId.trim() === "";
    return { runId: null, itemId: null, reason: missing ? "missing-id" : "invalid-id" };
  }
  const itemId = sanitizeLiveConsoleItemId(params.get("item")) ?? hashItemId(hash);
  return { runId, itemId, reason: "ok" };
}

function appearanceParams(search: string): URLSearchParams {
  const current = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const kept = new URLSearchParams();
  for (const key of APPEARANCE_KEYS) {
    const value = current.get(key);
    if (value !== null && value !== "") kept.set(key, value);
  }
  return kept;
}

/** Keep appearance pins. Drop `t` and any other query. */
export function writeLiveConsoleSearch(input: {
  search: string;
  runId: string;
  itemId?: string | null;
  includeId?: boolean;
}): string {
  const params = appearanceParams(input.search);
  if (input.includeId !== false) params.set("id", input.runId);
  const item = sanitizeLiveConsoleItemId(input.itemId);
  if (item === null) params.delete("item");
  else params.set("item", item);
  const qs = params.toString();
  return qs === "" ? "" : `?${qs}`;
}
