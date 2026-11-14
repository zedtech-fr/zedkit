const PROVIDER_PREFIX = /^(?:cursor|openai|anthropic)-/;
const EFFORT_SUFFIX = /-(?:high|xhigh|max|medium|low|minimal|none|fast)$/;

function titleCasePart(part: string): string {
  if (part === "gpt") return "GPT";
  return part.charAt(0).toUpperCase() + part.slice(1);
}

/** Short visitor label for a stored model id (`cursor-grok-4.6-high` → `Grok 4.6`). */
export function displayModelLabel(id: string): string {
  const trimmed = id.trim();
  if (trimmed === "") return trimmed;
  const lower = trimmed.toLowerCase();
  if (lower.includes("grok")) {
    const version = lower.match(/grok[- ]?(\d+(?:\.\d+)?)/);
    return version ? `Grok ${version[1]}` : "Grok";
  }
  if (lower.includes("muse")) return "Muse";
  if (lower.includes("claude")) {
    if (lower.includes("opus")) return "Claude Opus";
    if (lower.includes("sonnet")) return "Claude Sonnet";
    if (lower.includes("haiku")) return "Claude Haiku";
    return "Claude";
  }
  if (lower.includes("gemini")) return "Gemini";
  if (lower.includes("composer")) return "";
  return lower
    .replace(PROVIDER_PREFIX, "")
    .replace(EFFORT_SUFFIX, "")
    .split(/[-_]/)
    .filter(Boolean)
    .map(titleCasePart)
    .join(" ");
}

/** Unique shortened labels, source order. */
export function displayModelLabels(models: readonly string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const model of models) {
    const label = displayModelLabel(model);
    if (label === "" || seen.has(label)) continue;
    seen.add(label);
    out.push(label);
  }
  return out.join(", ");
}
