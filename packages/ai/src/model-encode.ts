// Original work by the same author.
import type { Effort, PolicyProvider } from "./tokenomics.js";

// Cursor Task lists thinking variants as `<base>-<level>`. Families that have
// none (composer) stay bare. Prefix rows are data: add a family here.
const CURSOR_THINKING_PREFIXES = ["claude-", "cursor-grok-"] as const;
const CURSOR_LEVEL: Readonly<Record<Effort, string>> = { low: "low", medium: "medium", high: "high", max: "xhigh" };
const HAS_LEVEL = /-(?:low|medium|high|xhigh)$/;

/**
 * The id a tool lists for a cell: base `model` plus `effort`. Cells hold a base
 * id; the thinking level is the provider's spelling, written here and nowhere
 * else. An id that already ends in a level is a legacy cell and is kept.
 * Providers with no verified per-agent effort spelling get the id unchanged.
 */
export function encodeModel(provider: PolicyProvider, model: string, effort: Effort): string {
  if (provider !== "cursor" || HAS_LEVEL.test(model)) return model;
  if (!CURSOR_THINKING_PREFIXES.some((prefix) => model.startsWith(prefix))) return model;
  return `${model}-${CURSOR_LEVEL[effort]}`;
}
