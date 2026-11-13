import { cpSync, existsSync, readdirSync, readFileSync, readlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { main } from "#cli.js";
import { hasMarker } from "#generate.js";
import { installKit } from "#install.js";
import { deprecatedCommandNames, kitDir, readManifest } from "#kit.js";
import { tempDir } from "./helpers.js";

const SENTINEL = "KIT_B_ROUTES_SENTINEL_314_UNIQUE";
const pkgRoot = join(fileURLToPath(new URL("../..", import.meta.url)));

function leftoverStems(): string[] {
  const manifest = readManifest();
  if (!manifest.ok) throw manifest.error;
  return deprecatedCommandNames(manifest.value);
}

function install(dest: string, provider: string): void {
  const result = installKit({ dest, preset: "starter", providers: [provider] });
  if (!result.ok) throw result.error;
}

function expectRoutes(path: string): void {
  expect(existsSync(path), path).toBe(true);
  expect(readFileSync(path, "utf8")).toContain("| Command");
}

function expectNoLeftovers(dest: string, commandsDir: string): void {
  for (const stem of leftoverStems()) {
    expect(existsSync(join(dest, commandsDir, `${stem}.md`)), `${commandsDir}/${stem}.md`).toBe(false);
  }
}

function run(...argv: string[]): { code: number; text: string; errors: string } {
  const out: string[] = [];
  const errors: string[] = [];
  const code = main(argv, { out: (line) => out.push(line), err: (line) => errors.push(line) });
  return { code, text: out.join("\n"), errors: errors.join("\n") };
}

function kitB(): string {
  const kit = tempDir();
  cpSync(kitDir(), kit, { recursive: true });
  const routes = join(kit, "skills/zedkit-ai/routes.md");
  writeFileSync(routes, `${readFileSync(routes, "utf8")}\n<!-- ${SENTINEL} -->\n`);
  return kit;
}

describe("provider entry command and routes.md", () => {
  it("Cursor: command link, skill routes.md, no leftover command stems", () => {
    const dest = tempDir();
    install(dest, "cursor");
    const command = join(dest, ".cursor/commands/zedkit-ai.md");
    expect(readlinkSync(command)).toBe("../../.agents/commands/zedkit-ai.md");
    expect(readFileSync(command, "utf8")).toContain("run the `zedkit-ai` skill");
    expectRoutes(join(dest, ".cursor/skills/zedkit-ai/routes.md"));
    expectNoLeftovers(dest, ".cursor/commands");
    expectNoLeftovers(dest, ".agents/commands");
  });

  it("Claude: commands link, installed skill keeps disable-model-invocation and by-path, routes.md, no leftovers", () => {
    const dest = tempDir();
    install(dest, "claude");
    expect(readlinkSync(join(dest, ".claude/commands"))).toBe("../.agents/commands");
    expect(existsSync(join(dest, ".claude/commands/zedkit-ai.md"))).toBe(true);
    const skill = readFileSync(join(dest, ".claude/skills/zedkit-ai/SKILL.md"), "utf8");
    expect(skill).toContain("disable-model-invocation: true");
    expect(skill).toContain("by path");
    expectRoutes(join(dest, ".claude/skills/zedkit-ai/routes.md"));
    expectNoLeftovers(dest, ".claude/commands");
  });

  it("Codex: shared source only — AGENTS.md, entry command, routes.md, no leftover stems", () => {
    const dest = tempDir();
    install(dest, "codex");
    expect(existsSync(join(dest, ".cursor"))).toBe(false);
    expect(existsSync(join(dest, ".claude"))).toBe(false);
    expect(existsSync(join(dest, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(dest, ".agents/commands/zedkit-ai.md"))).toBe(true);
    expectRoutes(join(dest, ".agents/skills/zedkit-ai/routes.md"));
    expectNoLeftovers(dest, ".agents/commands");
  });

  it("Muse: skill routes.md, generated agents, leftover stems absent (commands are not a Muse scan root)", () => {
    const dest = tempDir();
    install(dest, "muse");
    expectRoutes(join(dest, ".agents/skills/zedkit-ai/routes.md"));
    const agents = readdirSync(join(dest, ".agents/agents")).filter((name) => name.endsWith(".md"));
    expect(agents.some((name) => hasMarker(readFileSync(join(dest, ".agents/agents", name), "utf8")))).toBe(true);
    expectNoLeftovers(dest, ".agents/commands");
  });

  it("setup --kit kit-b installs that kit's routes.md; validate --kit is green; omitted --kit has no sentinel", () => {
    const kit = kitB();
    const withKit = tempDir();
    expect(run("setup", withKit, "--kit", kit, "--provider", "cursor").code).toBe(0);
    expect(readFileSync(join(withKit, ".agents/skills/zedkit-ai/routes.md"), "utf8")).toContain(SENTINEL);
    expect(readFileSync(join(withKit, ".cursor/skills/zedkit-ai/routes.md"), "utf8")).toContain(SENTINEL);

    const validated = run("validate", withKit, "--kit", kit);
    expect(validated.code).toBe(0);
    const last = validated.text.trimEnd().split("\n").at(-1) ?? "";
    expect(last).toMatch(/^ok\b/);

    const bundled = tempDir();
    expect(run("setup", bundled, "--provider", "cursor").code).toBe(0);
    const bundledRoutes = readFileSync(join(bundled, ".agents/skills/zedkit-ai/routes.md"), "utf8");
    expect(bundledRoutes).not.toContain(SENTINEL);
    expect(bundledRoutes).toContain("| Command");
  });

  it("pins the Muse fallback: skills + agents + AGENTS.md; invoke the skill by name; commands are not a scan root", () => {
    const readme = readFileSync(join(pkgRoot, "README.md"), "utf8");
    const setupAi = readFileSync(join(kitDir(), "skills/setup-ai/SKILL.md"), "utf8");
    const onboarding = readFileSync(join(kitDir(), "cursor-onboarding.md"), "utf8");
    const usage = readFileSync(join(kitDir(), "usage.txt"), "utf8");
    const musePaste = "zedkit-ai: set up this repo from what it contains";
    for (const [label, text] of [
      ["README", readme],
      ["setup-ai", setupAi],
      ["cursor-onboarding", onboarding],
    ] as const) {
      expect(text, label).toContain("does not scan `.agents/commands`");
      expect(text, label).toContain("invoke the `zedkit-ai` skill by name");
    }
    const intro = readme.slice(0, readme.indexOf("## Upgrading from 1.1.x"));
    expect(intro).toContain(musePaste);
    expect(onboarding).toContain(musePaste);
    expect(usage).toContain(musePaste);
    const readmeProviders = readme.slice(readme.indexOf("## Providers"), readme.indexOf("## Tokenomics"));
    const readmeChoices = readme.slice(readme.indexOf("## Choices worth knowing"), readme.indexOf("## API"));
    const providers = setupAi.slice(setupAi.indexOf("## Providers"), setupAi.indexOf("## Tokenomics"));
    const write = setupAi.slice(setupAi.indexOf("## Write shared source"), setupAi.indexOf("### Plan reconciliation"));
    expect(readmeProviders).toMatch(/`muse`[^\n]*does not scan `\.agents\/commands`/);
    expect(readmeChoices).toContain("does not scan `.agents/commands`");
    expect(providers).toMatch(/`muse`[^\n]*does not scan `\.agents\/commands`/);
    expect(write).toMatch(/`muse`[^\n]*does not scan `\.agents\/commands`/);
  });

  it("does not publish a changeset that maps guides MDX to /docs/ai/setup", () => {
    const changeset = readFileSync(join(pkgRoot, "../..", ".changeset/ai-provider-entry-routes.md"), "utf8");
    expect(changeset).not.toMatch(/guides MDX to `\/docs\/ai\/setup`/);
    expect(changeset).toMatch(/guides MDX to `\/docs\/<slug>`/);
    expect(changeset).toContain("`/docs/ai/setup`");
  });
});
