// Original work by the same author.
/** Fill AGENTS.md Commands: observed scripts stay listed; e2e is never the recommendation. */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";

const E2E = /e2e|playwright|cypress|puppeteer|webdriver/iu;
const GATE = /^(dev|start|typecheck|lint|test|test:.*|build|check)$/u;
const RECOMMENDED = /^(test|test:unit|test:integration)$/u;

export function isObservedE2e(name: string, command = ""): boolean {
  return E2E.test(name) || E2E.test(command);
}

const PACKAGE_MANAGER_FIELD = /^(pnpm|npm|yarn|bun)@/u;
const LOCKFILE_RUNNERS: ReadonlyArray<readonly [string, string]> = [
  ["pnpm-lock.yaml", "pnpm"],
  ["package-lock.json", "npm"],
  ["yarn.lock", "yarn"],
  ["bun.lockb", "bun"],
  ["bun.lock", "bun"],
];

/**
 * The command runner a repo actually uses: the `packageManager` field first,
 * then lockfiles in a fixed order, else the kit default (`pnpm`).
 * Unknown field values and unreadable files fall through to the next source.
 */
export function detectRunner(dest: string): string {
  const raw = tryCatch(() => readFileSync(join(dest, "package.json"), "utf8"));
  if (raw.ok) {
    const parsed = tryCatch(() => JSON.parse(raw.value) as unknown);
    const field =
      parsed.ok && parsed.value !== null && typeof parsed.value === "object"
        ? (parsed.value as { packageManager?: unknown }).packageManager
        : undefined;
    if (typeof field === "string") {
      const name = PACKAGE_MANAGER_FIELD.exec(field.trim())?.[1];
      if (name !== undefined) return name;
    }
  }
  for (const [lockfile, runner] of LOCKFILE_RUNNERS) {
    if (existsSync(join(dest, lockfile))) return runner;
  }
  return "pnpm";
}

export function applyTestPolicyToAgentsMd(
  markdown: string,
  scripts?: Record<string, string>,
  runner = "pnpm",
): string {
  if (scripts === undefined) return markdown;
  const entries = Object.entries(scripts).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && GATE.test(entry[0]),
  );
  if (entries.length === 0) return markdown;
  const run = (name: string): string => (runner === "npm" ? `npm run ${name}` : `${runner} ${name}`);
  const observed = entries.map(([name, command]) => {
    const line = run(name);
    return isObservedE2e(name, command) ? `${line}  # observed; not the desired recommendation` : line;
  });
  const recommended = entries
    .filter(([name, command]) => RECOMMENDED.test(name) && !isObservedE2e(name, command))
    .map(([name]) => run(name));
  let next = replaceFenceAfter(markdown, "### Observed commands", observed.join("\n"));
  if (recommended.length > 0) {
    next = replaceFenceAfter(next, "### Test recommendation", recommended.join("\n"));
  }
  return next;
}

function replaceFenceAfter(markdown: string, heading: string, body: string): string {
  const start = markdown.indexOf(heading);
  if (start < 0) return markdown;
  const fence = markdown.indexOf("```sh", start);
  const nextHeading = markdown.indexOf("\n### ", start + heading.length);
  const nextH2 = markdown.indexOf("\n## ", start + heading.length);
  const sectionEnd = Math.min(
    ...[nextHeading, nextH2, markdown.length].filter((n) => n >= 0),
  );
  if (fence < 0 || fence > sectionEnd) {
    const insertAt = sectionEnd;
    const block = `\n\`\`\`sh\n${body}\n\`\`\`\n`;
    return `${markdown.slice(0, insertAt)}${block}${markdown.slice(insertAt)}`;
  }
  const openEnd = markdown.indexOf("\n", fence);
  const close = markdown.indexOf("\n```", openEnd);
  if (openEnd < 0 || close < 0) return markdown;
  return `${markdown.slice(0, openEnd + 1)}${body}${markdown.slice(close)}`;
}
