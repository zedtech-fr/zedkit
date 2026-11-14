import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { deprecatedCommandNames, readManifest } from "#kit.js";
import { lensTableRows, shippedNames, usageCommands, usageFlags, usageProviders } from "./helpers.js";

const PROSE = [
  "apps/docs/prose/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo.mdx",
  "apps/docs/prose/ai/check-that-skills-subagents-commands-and-provider-copies-are-valid.mdx",
  "apps/docs/prose/guides/set-up-your-coding-agents.mdx",
  "apps/docs/prose/guides/getting-started.mdx",
];
// --help works but lives outside the USAGE text (see cli.test.ts).
const HELP = new Set(["--help"]);
// Bare prose words, not references.
const GENERIC = new Set(["ok", "name", "description", "skill", "html", "inherit"]);

function lensNames(): Set<string> {
  return new Set(lensTableRows().map((cells) => cells[1] ?? ""));
}

function repoRoot(): string {
  return fileURLToPath(new URL("../../../..", import.meta.url));
}

function expandGuideSnippets(text: string): string {
  return text.replace(/\{\{snippet:([a-zA-Z0-9._-]+)\}\}/g, (_full, id: string) => {
    const path = join(repoRoot(), "apps/docs/prose/guides/snippets", id);
    return existsSync(path) ? readFileSync(path, "utf8") : `{{snippet:${id}}}`;
  });
}

function zedkitAiCommandExamples(text: string): string[] {
  const spans: string[] = [];
  for (const m of text.matchAll(/`([^`]*zedkit-ai[^`]*)`/gu)) {
    spans.push(m[1] ?? "");
  }
  for (const m of text.matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
    const block = m[1] ?? "";
    if (block.includes("zedkit-ai")) spans.push(block);
  }
  return spans;
}

function assertAiCliRefs(
  text: string,
  rel: string,
  flags: Set<string>,
  presets: Set<string>,
  providers: Set<string>,
): number {
  let checked = 0;
  for (const span of zedkitAiCommandExamples(text)) {
    for (const m of span.matchAll(/--[a-z][a-z0-9-]*/gu)) {
      checked += 1;
      expect([...flags], `${rel} uses ${m[0]}`).toContain(m[0]);
    }
    for (const m of span.matchAll(/--preset ([a-z][a-z0-9-]*)/gu)) {
      checked += 1;
      expect([...presets], `${rel} presets ${m[1]}`).toContain(m[1] ?? "");
    }
    for (const m of span.matchAll(/--provider ([a-z][a-z0-9-,]*)/gu)) {
      for (const name of (m[1] ?? "").split(",")) {
        checked += 1;
        expect([...providers], `${rel} provides ${name}`).toContain(name);
      }
    }
  }
  return checked;
}

function cliContract(): { flags: Set<string>; presets: Set<string>; providers: Set<string> } {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return {
    flags: new Set([...usageFlags(), ...HELP]),
    presets: new Set(Object.keys(manifest.value.presets)),
    providers: new Set(usageProviders()),
  };
}

describe("prose references", () => {
  it("resolves every bare name in AI prose to a kit concept", () => {
    const known = new Set([
      ...shippedNames(true),
      ...lensNames(),
      ...usageCommands(),
      ...usageProviders(),
    ]);
    let checked = 0;
    for (const rel of PROSE) {
      const text = readFileSync(join(repoRoot(), rel), "utf8");
      const tokens = new Set(
        [...text.matchAll(/`([a-z][a-z0-9-]*)`/gu)]
          .map((m) => m[1] ?? "")
          .filter((t) => !GENERIC.has(t)),
      );
      for (const token of tokens) {
        checked += 1;
        expect([...known], `${rel} references ${token}`).toContain(token);
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("catalog install page does not advertise leftover commands as live slash commands", () => {
    const prose = readFileSync(
      join(repoRoot(), "apps/docs/prose/ai/set-up-ai-agent-instructions-skills-subagents-and-commands-in-a-repo.mdx"),
      "utf8",
    );
    expect(prose).not.toContain("Bundled slash commands");
    expect(prose).not.toContain("`/orchestrate`");
    expect(prose).toContain("/zedkit-ai <request>");
    expect(prose).toMatch(/Deprecated leftover command files/);
    const block = /kind="command"\s+names=\{\[([^\]]*)\]\}/.exec(prose);
    expect(block, "DocsKitNameList command names").not.toBeNull();
    const listed = [...(block?.[1] ?? "").matchAll(/"([a-z0-9-]+)"/g)].map((m) => m[1] ?? "");
    const manifest = readManifest();
    if (!manifest.ok) throw manifest.error;
    expect(listed).toEqual(deprecatedCommandNames(manifest.value));
  });

  it("printed sync --prune commands include --provider", () => {
    const rels = [
      ...readdirSync(join(repoRoot(), ".changeset"))
        .filter((name) => name.endsWith(".md"))
        .map((name) => `.changeset/${name}`),
      "packages/ai/README.md",
    ];
    let checked = 0;
    for (const rel of rels) {
      const text = readFileSync(join(repoRoot(), rel), "utf8");
      for (const span of zedkitAiCommandExamples(text)) {
        if (!/\bsync\b/.test(span) || !/--prune(?:\s|$)/.test(span)) continue;
        checked += 1;
        expect(span, `${rel}: --prune needs --provider (sync.ts exits 2 without it)`).toMatch(
          /--provider/,
        );
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("resolves every CLI flag and value in ZedKit AI command examples to USAGE", () => {
    const { flags, presets, providers } = cliContract();
    let checked = 0;
    for (const rel of PROSE) {
      const text = expandGuideSnippets(readFileSync(join(repoRoot(), rel), "utf8"));
      checked += assertAiCliRefs(text, rel, flags, presets, providers);
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("accepts shadcn --preset nova and still rejects an invalid AI preset", () => {
    const { flags, presets, providers } = cliContract();
    const mixed = [
      "`npx shadcn@latest init -y --base radix --preset nova`",
      "```sh\nnpx @zedtech/zedkit-ai init --preset core --provider cursor\n```",
    ].join("\n");
    expect(assertAiCliRefs(mixed, "fixture.mdx", flags, presets, providers)).toBeGreaterThan(0);
    expect(() =>
      assertAiCliRefs(
        "`npx @zedtech/zedkit-ai init --preset not-a-preset`",
        "bad.mdx",
        flags,
        presets,
        providers,
      ),
    ).toThrow(/not-a-preset/);
  });
});
